import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let visitId = "";
    let audioBuffer: Buffer;
    let saveToDb = true;

    if (contentType.includes("multipart/form-data")) {
      // Handle File Upload + Transcription
      const formData = await request.formData();
      const file = formData.get("audio") as File;
      visitId = formData.get("visitId") as string;
      saveToDb = formData.get("saveToDb") !== "false";

      if (!file || !visitId) {
        return NextResponse.json(
          { error: "Arquivo de áudio e visitId são obrigatórios" },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      audioBuffer = Buffer.from(bytes);

      // Upload to Vercel Blob for persistent storage
      let audioUrl = "processed-in-memory";

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const filename = `audio/${visitId}-${Date.now()}.webm`;
        const blob = await put(filename, audioBuffer, {
          access: "public",
          contentType: "audio/webm",
        });
        audioUrl = blob.url;
        console.log("Audio uploaded to Vercel Blob:", audioUrl);
      } else {
        console.log("No BLOB_READ_WRITE_TOKEN, audio will not be persisted");
      }

      // Update visit with audio URL
      await prisma.visit.update({
        where: { id: visitId },
        data: { audioUrl },
      });

    } else {
      // JSON mode: re-transcribe existing audio
      const body = await request.json();
      visitId = body.visitId;

      if (!visitId) {
        return NextResponse.json({ error: "visitId obrigatório" }, { status: 400 });
      }

      const visit = await prisma.visit.findUnique({ where: { id: visitId } });
      if (!visit?.audioUrl) {
        return NextResponse.json({ error: "Audio não encontrado" }, { status: 404 });
      }

      // If it's the placeholder, we can't re-transcribe
      if (visit.audioUrl === "processed-in-memory") {
        return NextResponse.json(
          { error: "Audio processado em memória e não mais disponível." },
          { status: 400 }
        );
      }

      // Fetch audio from Vercel Blob URL or local path
      if (visit.audioUrl.startsWith("http")) {
        const response = await fetch(visit.audioUrl);
        if (!response.ok) {
          return NextResponse.json({ error: "Erro ao buscar audio" }, { status: 500 });
        }
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
      } else {
        // Legacy: local file path
        const { readFile } = await import("fs/promises");
        const path = await import("path");
        const audioPath = path.join(
          process.cwd(),
          visit.audioUrl.startsWith("/") ? visit.audioUrl.slice(1) : visit.audioUrl
        );
        audioBuffer = await readFile(audioPath);
      }
    }

    // --- Transcription with OpenAI Whisper ---
    console.log("Transcribing audio...");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const audioFile = new File([new Uint8Array(audioBuffer)], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "pt",
      response_format: "text",
    });

    const formattedText = transcription;

    if (saveToDb) {
      // Update Visit with transcription
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
          details: "Transcrição gerada via Whisper API",
        },
      });
    }

    return NextResponse.json({
      text: formattedText,
      segments: [],
    });

  } catch (error: unknown) {
    console.error("Erro na transcrição:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro na transcrição: ${message}` }, { status: 500 });
  }
}
