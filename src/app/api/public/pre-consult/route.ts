import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token, ...data } = body;

        console.log("Receiving pre-consult data for token:", token);

        // Find appointment by token
        // Since we decided to put shareToken on Appointment or Visit, let's verify schema.
        // In schema we added shareToken to Appointment (wait, let me check where I added it)
        // I added shareToken to Appointment in the previous turn.

        const appointment = await prisma.appointment.findFirst({
            where: {
                shareToken: token,
                status: "scheduled"
            }
        });

        if (!appointment) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
        }

        // Create or Update PreConsultation
        await prisma.preConsultation.upsert({
            where: {
                appointmentId: appointment.id
            },
            create: {
                appointmentId: appointment.id,
                ...data,
                status: "completed",
                filledAt: new Date()
            },
            update: {
                ...data,
                status: "completed",
                filledAt: new Date()
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error saving pre-consult:", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const appointment = await prisma.appointment.findFirst({
        where: { shareToken: token },
        select: {
            id: true,
            patientName: true,
            scheduledAt: true,
            user: {
                select: { name: true } // Doctor name
            },
            preConsultation: true
        }
    });

    if (!appointment) {
        return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    return NextResponse.json({
        doctorName: appointment.user.name,
        patientName: appointment.patientName,
        date: appointment.scheduledAt,
        existingData: appointment.preConsultation
    });
}
