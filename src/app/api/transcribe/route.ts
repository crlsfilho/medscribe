import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transcribeAudioWithDiarization } from "@/lib/whisper";
import { diarizeTranscription, DiarizedSegment } from "@/lib/llm";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { visitId } = await request.json();

    if (!visitId) {
      return NextResponse.json(
        { error: "ID da consulta é obrigatório" },
        { status: 400 }
      );
    }

    // Get visit with audio URL
    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        userId: session.user.id,
      },
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    if (!visit.audioUrl) {
      return NextResponse.json(
        { error: "Nenhum áudio encontrado para esta consulta" },
        { status: 400 }
      );
    }

    // Transcribe audio
    const result = await transcribeAudioWithDiarization(visit.audioUrl);

    // Run speaker diarization using LLM
    let diarizedSegments: DiarizedSegment[] = [];
    let formattedText = result.text;

    try {
      const diarized = await diarizeTranscription(result.text);
      diarizedSegments = diarized.segments;

      // Format text with speaker labels
      if (diarizedSegments.length > 0) {
        formattedText = diarizedSegments
          .map((seg) => {
            const speakerLabel =
              seg.speaker === "medico"
                ? "Medico"
                : seg.speaker === "paciente"
                  ? "Paciente"
                  : "Desconhecido";
            return `${speakerLabel}: ${seg.text}`;
          })
          .join("\n\n");
      }
    } catch (diarError) {
      console.error("Erro na diarizacao (continuando sem):", diarError);
      // Continue with raw transcription if diarization fails
    }

    // Update visit with transcription (with speaker labels if available)
    await prisma.visit.update({
      where: { id: visitId },
      data: { transcriptText: formattedText },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        visitId,
        action: "transcribed",
        details: `Transcrição gerada com ${diarizedSegments.length} segmentos identificados`,
      },
    });

    return NextResponse.json({
      text: formattedText,
      segments: diarizedSegments.map((seg, index) => ({
        id: `seg-${index}`,
        speaker: seg.speaker,
        text: seg.text,
        confidence: seg.confidence,
      })),
    });
  } catch (error) {
    console.error("Erro na transcrição:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for specific errors
    if (errorMessage.includes("API key") || errorMessage.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "Chave de API OpenAI não configurada. Configure OPENAI_API_KEY no arquivo .env" },
        { status: 500 }
      );
    }

    if (errorMessage.includes("ENOENT") || errorMessage.includes("no such file")) {
      return NextResponse.json(
        { error: "Arquivo de áudio não encontrado. Tente fazer upload novamente." },
        { status: 500 }
      );
    }

    if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Chave de API OpenAI inválida. Verifique sua OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      return NextResponse.json(
        { error: "Limite de requisições excedido. Aguarde alguns minutos e tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: `Erro ao transcrever áudio: ${errorMessage}` },
      { status: 500 }
    );
  }
}
