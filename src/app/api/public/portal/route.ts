import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
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

        return NextResponse.json(patient);
    } catch (error) {
        console.error("Error fetching portal data:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
