import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    // Rate limit: 20 requests per minute per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success } = rateLimit(`portal:${ip}`, 20, 60_000);
    if (!success) {
        return NextResponse.json({ error: "Muitas requisições. Tente novamente em breve." }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    try {
        const patient = await prisma.patient.findUnique({
            where: { shareToken: token },
            include: {
                visits: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        createdAt: true,
                        laymanSummary: true,
                        carePlan: true,
                        returnChecklist: true,
                        // Add links to generated PDFs if stored (actionableItems?)
                        actionableItems: {
                            where: { status: 'completed' }
                        }
                    }
                }
            }
        });

        if (!patient) {
            return NextResponse.json({ error: "Invalid token" }, { status: 404 });
        }

        // Validate token expiration
        if (patient.shareTokenExpiresAt && new Date(patient.shareTokenExpiresAt) < new Date()) {
            return NextResponse.json(
                { error: "Token expirado. Solicite um novo link ao seu médico." },
                { status: 403 }
            );
        }

        return NextResponse.json(patient);
    } catch (error) {
        console.error("Error fetching portal data:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
