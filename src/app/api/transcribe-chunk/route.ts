import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File;
    const visitId = formData.get("visitId") as string;
    const chunkIndex = parseInt((formData.get("chunkIndex") as string) || "0");

    if (!file || !visitId) {
      return NextResponse.json(
        { error: "Arquivo de áudio e visitId são obrigatórios" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const audioBuffer = Buffer.from(bytes);

    console.log(`[Chunk ${chunkIndex}] Processing audio for visit ${visitId}`);

    // Transcribe with Whisper
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const audioName = file.name || "chunk.webm";
    const audioMime = file.type || "audio/webm";

    const audioFile = new File([new Uint8Array(audioBuffer)], audioName, { type: audioMime });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "pt",
      response_format: "text",
    });

    const chunkText = transcription.trim();

    let pulse = "";
    if (chunkText) {
      const currentVisit = await prisma.visit.findUnique({
        where: { id: visitId },
        select: { transcriptText: true }
      });

      const previousText = currentVisit?.transcriptText || "";
      const updatedText = previousText ? `${previousText}\n\n${chunkText}` : chunkText;

      await prisma.visit.update({
        where: { id: visitId },
        data: { transcriptText: updatedText }
      });

      try {
        const pulseRes = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Você é um assistente médico conciso. Resuma o ponto principal ou queixa deste trecho de transcrição de consulta em exatamente uma frase curta de no máximo 6 palavras. Retorne apenas o resumo, sem aspas." },
            { role: "user", content: chunkText }
          ],
          temperature: 0.3,
          max_tokens: 30,
        });
        pulse = pulseRes.choices[0]?.message?.content?.trim() || "";
      } catch (pulseError) {
        console.error("Pulse generation failed (non-critical):", pulseError);
      }
    }

    return NextResponse.json({
      text: chunkText,
      chunkIndex,
      pulse,
      success: true
    });

  } catch (error: unknown) {
    console.error("Erro na transcrição do segmento:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro no chunk: ${message}` }, { status: 500 });
  }
}
