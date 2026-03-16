/**
 * Speaker Diarization - Identifica quem fala (Médico vs Paciente)
 *
 * ESTRATÉGIAS:
 * 1. Pattern-based: Detecta padrões linguísticos (médico usa termos técnicos)
 * 2. LLM-based: Usa Claude/GPT para identificar speakers
 * 3. API-based: Deepgram/AssemblyAI (mais caro, mais preciso)
 */

import OpenAI from "openai";

interface DiarizedSegment {
  speaker: "doctor" | "patient" | "unknown";
  text: string;
  timestamp?: string;
  confidence?: number;
}

interface DiarizationResult {
  segments: DiarizedSegment[];
  formatted: string; // Texto formatado com labels
  summary: {
    doctorTurns: number;
    patientTurns: number;
    totalTurns: number;
  };
}

/**
 * Método 1: Pattern-Based (GRÁTIS, rápido, ~70% de precisão)
 * Detecta padrões linguísticos para inferir quem fala
 */
export function diarizeWithPatterns(transcript: string): DiarizationResult {
  const segments: DiarizedSegment[] = [];

  // Split por pausas longas ou mudanças de tópico
  const utterances = transcript.split(/\n+|\.{2,}|\.\s{2,}/);

  let currentSpeaker: "doctor" | "patient" = "doctor"; // Assume médico começa

  utterances.forEach((text) => {
    const cleaned = text.trim();
    if (!cleaned) return;

    // Padrões que indicam médico
    const doctorPatterns = [
      /\b(vou|vamos) (examinar|auscultar|verificar|prescrever|solicitar)\b/i,
      /\b(seu|sua) (pressão|coração|pulmão|exame)\b/i,
      /\btoma(r)? (algum medicamento|remédio)\b/i,
      /\b(histórico|antecedentes) (familiar|médico)\b/i,
      /\bvou (pedir|solicitar) (exame|raio-x|ultrassom)\b/i,
      /\b(receita|prescrição|medicação)\b/i,
      /CID|diagnóstico|prognóstico/i,
    ];

    // Padrões que indicam paciente
    const patientPatterns = [
      /\bestou sentindo\b/i,
      /\bdói|doendo|dolorido\b/i,
      /\bme sinto\b/i,
      /\bcomecei a (sentir|ter)\b/i,
      /\bfaz (uns dias|uma semana|um mês)\b/i,
      /\bsim, doutor|não, doutor\b/i,
    ];

    const isDoctorMatch = doctorPatterns.some((p) => p.test(cleaned));
    const isPatientMatch = patientPatterns.some((p) => p.test(cleaned));

    // Decide speaker
    if (isDoctorMatch && !isPatientMatch) {
      currentSpeaker = "doctor";
    } else if (isPatientMatch && !isDoctorMatch) {
      currentSpeaker = "patient";
    }
    // Se ambos ou nenhum match, mantém speaker atual

    segments.push({
      speaker: currentSpeaker,
      text: cleaned,
      confidence: isDoctorMatch || isPatientMatch ? 0.7 : 0.4,
    });
  });

  // Format output
  const formatted = segments
    .map((s) => {
      const label = s.speaker === "doctor" ? "🩺 Médico:" : "🧑 Paciente:";
      return `${label} ${s.text}`;
    })
    .join("\n\n");

  const summary = {
    doctorTurns: segments.filter((s) => s.speaker === "doctor").length,
    patientTurns: segments.filter((s) => s.speaker === "patient").length,
    totalTurns: segments.length,
  };

  return { segments, formatted, summary };
}

/**
 * Método 2: LLM-Based (PAGO, ~95% de precisão)
 * Usa GPT-4/Claude para identificar speakers com contexto
 */
export async function diarizeWithLLM(
  transcript: string,
  provider: "openai" | "anthropic" = "openai"
): Promise<DiarizationResult> {
  if (provider === "openai") {
    return await diarizeWithOpenAI(transcript);
  } else {
    return await diarizeWithClaude(transcript);
  }
}

async function diarizeWithOpenAI(transcript: string): Promise<DiarizationResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Você é um assistente que identifica quem fala em transcrições médicas.

TRANSCRIÇÃO:
"""
${transcript}
"""

TAREFA:
1. Identifique cada turno de fala
2. Classifique como [MÉDICO] ou [PACIENTE]
3. Retorne no formato:

[MÉDICO]: texto aqui
[PACIENTE]: texto aqui
[MÉDICO]: texto aqui

REGRAS:
- Médico usa termos técnicos, faz perguntas diagnósticas, prescreve
- Paciente descreve sintomas, responde perguntas
- Se incerto, use contexto adjacente
- Seja preciso e conciso`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 4000,
  });

  const diarizedText = response.choices[0].message.content || "";

  // Parse response
  const segments: DiarizedSegment[] = [];
  const lines = diarizedText.split("\n");

  lines.forEach((line) => {
    const medicMatch = line.match(/^\[MÉDICO\]:\s*(.+)$/i);
    const patientMatch = line.match(/^\[PACIENTE\]:\s*(.+)$/i);

    if (medicMatch) {
      segments.push({
        speaker: "doctor",
        text: medicMatch[1].trim(),
        confidence: 0.95,
      });
    } else if (patientMatch) {
      segments.push({
        speaker: "patient",
        text: patientMatch[1].trim(),
        confidence: 0.95,
      });
    }
  });

  const formatted = segments
    .map((s) => {
      const label = s.speaker === "doctor" ? "🩺 Médico:" : "🧑 Paciente:";
      return `${label} ${s.text}`;
    })
    .join("\n\n");

  const summary = {
    doctorTurns: segments.filter((s) => s.speaker === "doctor").length,
    patientTurns: segments.filter((s) => s.speaker === "patient").length,
    totalTurns: segments.length,
  };

  return { segments, formatted, summary };
}

async function diarizeWithClaude(transcript: string): Promise<DiarizationResult> {
  // TODO: Implement with Anthropic SDK
  // Similar to OpenAI but using Claude API
  throw new Error("Claude diarization not implemented yet");
}

/**
 * Método 3: API-Based (MAIS CARO, ~98% precisão)
 * Deepgram ou AssemblyAI fazem diarização durante transcrição
 */
export async function diarizeWithDeepgram(
  audioBuffer: Buffer
): Promise<DiarizationResult> {
  // Requires Deepgram API key
  // Cost: ~$0.0125/min (mais caro que Whisper)

  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
  if (!DEEPGRAM_API_KEY) {
    throw new Error("DEEPGRAM_API_KEY not configured");
  }

  const response = await fetch("https://api.deepgram.com/v1/listen?diarize=true&language=pt", {
    method: "POST",
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      "Content-Type": "audio/webm",
    },
    body: audioBuffer as unknown as BodyInit,
  });

  const data = await response.json();

  // Parse Deepgram response
  const segments: DiarizedSegment[] = [];

  if (data.results?.channels?.[0]?.alternatives?.[0]?.words) {
    const words = data.results.channels[0].alternatives[0].words;

    let currentSpeaker = -1;
    let currentText = "";

    words.forEach((word: any) => {
      if (word.speaker !== currentSpeaker) {
        if (currentText) {
          segments.push({
            speaker: currentSpeaker === 0 ? "doctor" : "patient",
            text: currentText.trim(),
            confidence: 0.98,
          });
        }
        currentSpeaker = word.speaker;
        currentText = word.word;
      } else {
        currentText += " " + word.word;
      }
    });

    // Push last segment
    if (currentText) {
      segments.push({
        speaker: currentSpeaker === 0 ? "doctor" : "patient",
        text: currentText.trim(),
        confidence: 0.98,
      });
    }
  }

  const formatted = segments
    .map((s) => {
      const label = s.speaker === "doctor" ? "🩺 Médico:" : "🧑 Paciente:";
      return `${label} ${s.text}`;
    })
    .join("\n\n");

  const summary = {
    doctorTurns: segments.filter((s) => s.speaker === "doctor").length,
    patientTurns: segments.filter((s) => s.speaker === "patient").length,
    totalTurns: segments.length,
  };

  return { segments, formatted, summary };
}

/**
 * Método Híbrido (RECOMENDADO)
 * 1. Usa Whisper para transcrever (barato)
 * 2. Usa pattern-based primeiro (grátis)
 * 3. Se confiança baixa, usa LLM (pago mas preciso)
 */
export async function diarizeHybrid(
  transcript: string,
  options: {
    useLLMIfLowConfidence?: boolean;
    confidenceThreshold?: number;
  } = {}
): Promise<DiarizationResult> {
  const { useLLMIfLowConfidence = true, confidenceThreshold = 0.6 } = options;

  // Tenta pattern-based primeiro
  const patternResult = diarizeWithPatterns(transcript);

  // Calcula confiança média
  const avgConfidence =
    patternResult.segments.reduce((sum, s) => sum + (s.confidence || 0), 0) /
    patternResult.segments.length;

  // Se confiança baixa e LLM habilitado, usa LLM
  if (useLLMIfLowConfidence && avgConfidence < confidenceThreshold) {
    console.log(`Low confidence (${avgConfidence.toFixed(2)}), using LLM`);
    return await diarizeWithLLM(transcript);
  }

  return patternResult;
}
