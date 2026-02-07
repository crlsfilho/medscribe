import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePatientSchema = z.object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").optional(),
    age: z.number().nullable().optional(),
    sex: z.string().nullable().optional(),
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

    const patient = await prisma.patient.findFirst({
        where: {
            id,
            userId: session.user.id,
        },
        include: {
            visits: {
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!patient) {
        return NextResponse.json(
            { error: "Paciente não encontrado" },
            { status: 404 }
        );
    }

    return NextResponse.json(patient);
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
        const data = updatePatientSchema.parse(body);

        const existingPatient = await prisma.patient.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existingPatient) {
            return NextResponse.json(
                { error: "Paciente não encontrado" },
                { status: 404 }
            );
        }

        const patient = await prisma.patient.update({
            where: { id },
            data,
        });

        return NextResponse.json(patient);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            );
        }

        console.error("Erro ao atualizar paciente:", error);
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

    const existingPatient = await prisma.patient.findFirst({
        where: {
            id,
            userId: session.user.id,
        },
    });

    if (!existingPatient) {
        return NextResponse.json(
            { error: "Paciente não encontrado" },
            { status: 404 }
        );
    }

    // Delete patient (Cascade will auto-delete visits if configured in Prisma schema)
    // Even if not cascade, we are deleting the parent.
    await prisma.patient.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}
