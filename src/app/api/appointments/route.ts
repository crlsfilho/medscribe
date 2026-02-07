import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/appointments - List appointments
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: {
      userId: string;
      scheduledAt?: { gte?: Date; lte?: Date };
    } = {
      userId: session.user.id,
    };

    if (startDate || endDate) {
      whereClause.scheduledAt = {};
      if (startDate) {
        whereClause.scheduledAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.scheduledAt.lte = new Date(endDate);
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    return NextResponse.json(
      { error: "Erro ao listar agendamentos" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create appointment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { patientName, patientAge, patientSex, scheduledAt, duration, notes } =
      body;

    if (!patientName || !scheduledAt) {
      return NextResponse.json(
        { error: "Nome do paciente e data sao obrigatorios" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: session.user.id,
        patientName,
        patientAge: patientAge ? parseInt(patientAge) : null,
        patientSex: patientSex || null,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 30,
        notes: notes || null,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar agendamento" },
      { status: 500 }
    );
  }
}
