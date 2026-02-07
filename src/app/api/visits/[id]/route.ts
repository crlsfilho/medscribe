import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateVisitSchema = z.object({
  transcriptText: z.string().optional(),
  soapJson: z.string().optional(),
  soapText: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const visit = await prisma.visit.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      patient: true,
      suggestions: true,
    },
  });

  if (!visit) {
    return NextResponse.json(
      { error: "Consulta não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(visit);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateVisitSchema.parse(body);

    // Verify visit belongs to user
    const existingVisit = await prisma.visit.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingVisit) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    const visit = await prisma.visit.update({
      where: { id },
      data,
      include: {
        patient: true,
        suggestions: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        visitId: visit.id,
        action: "edited",
        details: "Consulta atualizada",
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

    console.error("Erro ao atualizar consulta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const visit = await prisma.visit.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!visit) {
    return NextResponse.json(
      { error: "Consulta não encontrada" },
      { status: 404 }
    );
  }

  await prisma.visit.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
