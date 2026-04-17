import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import OpenAI from "openai";
import { diarizeHybrid } from "@/lib/speaker-diarization";

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
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      // Handle File Upload + Transcription
      const formData = await request.formData();
      file = formData.get("audio") as File;
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

      // Validate audio size (max 50MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (audioBuffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Arquivo muito grande. Máximo: 50MB" },
          { status: 400 }
        );
      }

      // Upload to Vercel Blob for persistent storage
      let audioUrl = "processed-in-memory";

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const filename = `audio/${visitId}-${Date.now()}.webm`;
        const blob = await put(filename, audioBuffer, {
          access: "public", // TODO: migrate to signed URLs when Vercel Blob supports private reads
          contentType: "audio/webm",
        });
        audioUrl = blob.url;
      } else {
        // Fallback for local development
        const fs = await import("fs");
        const path = await import("path");
        const uploadDir = path.join(process.cwd(), "public", "uploads", "audio");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `${visitId}-${Date.now()}.webm`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, audioBuffer);
        audioUrl = `/uploads/audio/${filename}`;
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
        // Legacy: local file path (no longer supported on Vercel)
        console.error("Attempted to access local file in serverless environment:", visit.audioUrl);
        return NextResponse.json(
          { error: "Audio local não disponível neste ambiente. Por favor, grave novamente." },
          { status: 400 }
        );
      }
    }

    // --- Transcription with OpenAI Whisper ---
    console.log("Transcribing audio...");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const audioName = file?.name || "audio.webm";
    const audioMime = file?.type || "audio/webm";

    const audioFile = new File([new Uint8Array(audioBuffer)], audioName, { type: audioMime });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "pt",
      response_format: "text",
    });

    const formattedText = transcription;

    // --- Speaker Diarization (Identifica Médico vs Paciente) ---
    console.log("Diarizing speakers...");
    const diarization = await diarizeHybrid(formattedText, {
      useLLMIfLowConfidence: true,
      confidenceThreshold: 0.6,
    });

    if (saveToDb) {
      // Update Visit with transcription AND diarized text
      await prisma.visit.update({
        where: { id: visitId },
        data: {
          transcriptText: diarization.formatted, // Salva com labels [MÉDICO]/[PACIENTE]
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          visitId,
          action: "transcribed",
          details: `Transcrição gerada via Whisper API com diarização (${diarization.summary.doctorTurns} turnos médico, ${diarization.summary.patientTurns} turnos paciente)`,
        },
      });
    }

    return NextResponse.json({
      text: formattedText, // Raw transcript
      diarizedText: diarization.formatted, // Texto com labels
      segments: diarization.segments, // Array de segmentos com speaker
      summary: diarization.summary, // Estatísticas
    });

  } catch (error: unknown) {
    console.error("Erro na transcrição:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro na transcrição: ${message}` }, { status: 500 });
  }
}
