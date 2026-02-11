import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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

        // Save File
        const uploadsDir = path.join(process.cwd(), "public/uploads/docs");
        await mkdir(uploadsDir, { recursive: true });

        const ext = file.name.split(".").pop() || "pdf";
        const filename = `${uuidv4()}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

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
                        url: `/uploads/docs/${filename}`,
                        uploadedAt: new Date().toISOString()
                    })
                }
            });
        }

        return NextResponse.json({ success: true, url: `/uploads/docs/${filename}` });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Falha no upload" }, { status: 500 });
    }
}
