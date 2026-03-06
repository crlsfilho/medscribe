import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const updatePatientSchema = z.object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").optional(),
    age: z.number().nullable().optional(),
    sex: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
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
            appointments: {
                orderBy: { scheduledAt: "desc" },
                take: 5,
            },
        },
    });

    if (!patient) {
        return NextResponse.json(
            { error: "Paciente não encontrado" },
            { status: 404 }
        );
    }

    // Auto-generate token if missing or expired
    const TOKEN_EXPIRY_DAYS = 30;
    const isExpired = patient.shareTokenExpiresAt && new Date(patient.shareTokenExpiresAt) < new Date();
    if (!patient.shareToken || isExpired) {
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);
        await prisma.patient.update({
            where: { id: patient.id },
            data: { shareToken: token, shareTokenExpiresAt: expiresAt }
        });
        patient.shareToken = token;
        patient.shareTokenExpiresAt = expiresAt;
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

        // Ensure token exists on update (with 30-day expiration)
        const TOKEN_EXPIRY_DAYS = 30;
        let shareToken = existingPatient.shareToken;
        let shareTokenExpiresAt = existingPatient.shareTokenExpiresAt;
        if (!shareToken || (shareTokenExpiresAt && new Date(shareTokenExpiresAt) < new Date())) {
            shareToken = uuidv4();
            shareTokenExpiresAt = new Date();
            shareTokenExpiresAt.setDate(shareTokenExpiresAt.getDate() + TOKEN_EXPIRY_DAYS);
        }

        const patient = await prisma.patient.update({
            where: { id },
            data: {
                ...data,
                shareToken,
                shareTokenExpiresAt,
            },
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

    await prisma.patient.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}
