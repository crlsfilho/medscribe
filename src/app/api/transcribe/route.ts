import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Check Content-Type to determine if we are receiving a file or just a visitId
  try {
    const contentType = request.headers.get("content-type") || "";
    let visitId = "";
    let audioPath = "";

    if (contentType.includes("multipart/form-data")) {
      // Handle File Upload + Transcription (Production/Vercel Mode)
      const formData = await request.formData();
      const file = formData.get("audio") as File;
      visitId = formData.get("visitId") as string;

      if (!file || !visitId) {
        return NextResponse.json(
          { error: "Arquivo de áudio e visitId são obrigatórios" },
          { status: 400 }
        );
      }

      // Save to /tmp for Vercel
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      // Use /tmp directory which is writable in Lambda
      const tempDir = "/tmp";
      const filename = `${visitId}-${Date.now()}.webm`;
      audioPath = path.join(tempDir, filename);

      await writeFile(audioPath, buffer);

      // Update visit with a placeholder URL (since we don't have permanent storage)
      await prisma.visit.update({
        where: { id: visitId },
        data: { audioUrl: "processed-in-memory" }
      });

    } else {
      // Legacy/Local Mode (JSON with visitId)
      // This part fails on Vercel if file was uploaded to ./uploads in a previous request
      const body = await request.json();
      visitId = body.visitId;

      if (!visitId) {
        return NextResponse.json({ error: "visitId obrigatório" }, { status: 400 });
      }

      const visit = await prisma.visit.findUnique({ where: { id: visitId } });
      if (!visit?.audioUrl) return NextResponse.json({ error: "Audio não encontrado" }, { status: 404 });

      // If it's the placeholder, we can't re-transcribe
      if (visit.audioUrl === "processed-in-memory") {
        return NextResponse.json({ error: "Audio processado em memória e não mais disponível." }, { status: 400 });
      }

      audioPath = path.join(process.cwd(), visit.audioUrl.startsWith("/") ? visit.audioUrl.slice(1) : visit.audioUrl);
    }

    // --- Transcription Interface ---
    console.log("Transcribing file:", audioPath);

    // Import OpenAI directly here to be safe and simple
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const audioBuffer = await readFile(audioPath);
    const audioFile = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "pt",
      response_format: "text",
    });

    const formattedText = transcription; // Skipping diarization for now to be safe/fast

    // Update Visit
    await prisma.visit.update({
      where: { id: visitId },
      data: { transcriptText: formattedText },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        visitId,
        action: "transcribed",
        details: "Transcrição gerada via Direct Upload (Vercel Fix)",
      },
    });

    // Cleanup /tmp file
    if (audioPath.startsWith("/tmp")) {
      try {
        await unlink(audioPath);
      } catch (e) {
        console.error("Error deleting temp file:", e);
      }
    }

    return NextResponse.json({
      text: formattedText,
      segments: [] // returning empty segments for now
    });

  } catch (error: any) {
    console.error("Erro na transcrição:", error);
    return NextResponse.json({ error: `Erro na transcrição: ${error.message}` }, { status: 500 });
  }
}
