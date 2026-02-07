import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/appointments/[id] - Get single appointment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Agendamento nao encontrado" },
        { status: 404 }
      );
    }

    if (appointment.userId !== session.user.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamento" },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments/[id] - Update appointment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Agendamento nao encontrado" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
    }

    const updateData: {
      patientName?: string;
      patientAge?: number | null;
      patientSex?: string | null;
      scheduledAt?: Date;
      duration?: number;
      notes?: string | null;
      status?: string;
      visitId?: string | null;
    } = {};

    if (body.patientName !== undefined) updateData.patientName = body.patientName;
    if (body.patientAge !== undefined)
      updateData.patientAge = body.patientAge ? parseInt(body.patientAge) : null;
    if (body.patientSex !== undefined) updateData.patientSex = body.patientSex;
    if (body.scheduledAt !== undefined)
      updateData.scheduledAt = new Date(body.scheduledAt);
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.visitId !== undefined) updateData.visitId = body.visitId;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar agendamento" },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Agendamento nao encontrado" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao deletar agendamento" },
      { status: 500 }
    );
  }
}
