import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const token = formData.get("token") as string | null;

        if (!file || !token) {
            return NextResponse.json({ error: "Arquivo e token obrigatorios" }, { status: 400 });
        }

        // Validate Token
        const patient = await prisma.patient.findUnique({
            where: { shareToken: token }
        });

        if (!patient) {
            return NextResponse.json({ error: "Token invalido" }, { status: 401 });
        }

        // Upload to Vercel Blob
        const ext = file.name.split(".").pop() || "pdf";
        const filename = `docs/${token}-${Date.now()}.${ext}`;

        const blob = await put(filename, file, {
            access: "public",
            contentType: file.type || "application/pdf",
        });

        const fileUrl = blob.url;

        // Record in DB (ActionableItem? Or new 'PatientUpload' model?)
        // For MVP, let's create an ActionableItem linked to the latest visit?
        // Or better yet, we just store it in a metadata field on the patient?
        // The prompt asked for "CRM" where results are visible.
        // Let's create an ActionableItem of type "exam_result" attached to the most recent visit.

        const lastVisit = await prisma.visit.findFirst({
            where: { patientId: patient.id },
            orderBy: { createdAt: 'desc' }
        });

        if (lastVisit) {
            await prisma.actionableItem.create({
                data: {
                    visitId: lastVisit.id,
                    type: "exam_result",
                    confidence: 1.0,
                    sourceText: `Upload do paciente: ${file.name}`,
                    status: "completed",
                    metadata: JSON.stringify({
                        filename: file.name,
                        url: fileUrl,
                        uploadedAt: new Date().toISOString()
                    })
                }
            });
        }

        return NextResponse.json({ success: true, url: fileUrl });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Falha no upload" }, { status: 500 });
    }
}
