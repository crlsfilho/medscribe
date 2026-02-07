import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";

export async function transcribeAudio(audioPath: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não configurada");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Remove leading slash if present
  const cleanPath = audioPath.startsWith("/") ? audioPath.slice(1) : audioPath;
  const absolutePath = path.join(process.cwd(), cleanPath);

  console.log("Transcrevendo arquivo:", absolutePath);

  const audioBuffer = await readFile(absolutePath);

  // Create a File-like object for OpenAI API
  const file = new File([audioBuffer], path.basename(audioPath), {
    type: "audio/webm",
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "pt",
    response_format: "text",
  });

  return transcription;
}

export async function transcribeAudioWithDiarization(
  audioPath: string
): Promise<{ text: string; segments?: Array<{ speaker: string; text: string }> }> {
  // For MVP, we'll just return the plain transcription
  // Speaker diarization would require additional processing
  const text = await transcribeAudio(audioPath);

  return { text };
}
