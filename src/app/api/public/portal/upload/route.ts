import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { rateLimit } from "@/lib/rate-limit";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    // Rate limit: 5 uploads per minute per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success } = rateLimit(`portal-upload:${ip}`, 5, 60_000);
    if (!success) {
        return NextResponse.json({ error: "Muitas requisições. Tente novamente em breve." }, { status: 429 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const token = formData.get("token") as string | null;

        if (!file || !token) {
            return NextResponse.json({ error: "Arquivo e token obrigatorios" }, { status: 400 });
        }

        // Validate file size (max 10MB for documents)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "Arquivo muito grande. Máximo: 10MB" },
                { status: 400 }
            );
        }

        // Validate file type
        const ALLOWED_DOC_TYPES = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
        ];
        if (!ALLOWED_DOC_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Tipo de arquivo não permitido. Apenas PDF e imagens." },
                { status: 400 }
            );
        }

        // Validate Token
        const patient = await prisma.patient.findUnique({
            where: { shareToken: token }
        });

        if (!patient) {
            return NextResponse.json({ error: "Token invalido" }, { status: 401 });
        }

        // Upload to Vercel Blob
        const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"];
        const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
        const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : "pdf";
        const filename = `docs/${patient.id}-${Date.now()}.${safeExt}`;

        const blob = await put(filename, file, {
            access: "public", // TODO: migrate to signed URLs when Vercel Blob supports private reads
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
