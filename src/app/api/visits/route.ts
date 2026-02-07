import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const visitSchema = z.object({
  patientId: z.string(),
  audioUrl: z.string().optional(),
  transcriptText: z.string().optional(),
  soapJson: z.string().optional(),
  soapText: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const visits = await prisma.visit.findMany({
    where: { userId: session.user.id },
    include: {
      patient: true,
      suggestions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(visits);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = visitSchema.parse(body);

    // Verify patient belongs to user
    const patient = await prisma.patient.findFirst({
      where: {
        id: data.patientId,
        userId: session.user.id,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    const visit = await prisma.visit.create({
      data: {
        ...data,
        userId: session.user.id,
      },
      include: {
        patient: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        visitId: visit.id,
        action: "created",
        details: `Consulta criada para ${patient.name}`,
      },
    });

    return NextResponse.json(visit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Erro ao criar consulta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
