import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { SOAP_SYSTEM_PROMPT, SOAP_USER_PROMPT, SOAPData, validateSOAPData, createEmptySOAP } from "./prompts";

const LLM_PROVIDER = process.env.LLM_PROVIDER || "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateWithOpenAI(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SOAP_SYSTEM_PROMPT },
      { role: "user", content: SOAP_USER_PROMPT + transcript },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "";
}

async function generateWithAnthropic(transcript: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    system: SOAP_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: SOAP_USER_PROMPT + transcript },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}

function extractJSON(text: string): string {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return text;
}

export async function generateSOAP(transcript: string): Promise<SOAPData> {
  if (!transcript.trim()) {
    return createEmptySOAP();
  }

  let response: string;

  try {
    if (LLM_PROVIDER === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      response = await generateWithAnthropic(transcript);
    } else if (process.env.OPENAI_API_KEY) {
      response = await generateWithOpenAI(transcript);
    } else {
      throw new Error("Nenhuma chave de API configurada (OPENAI_API_KEY ou ANTHROPIC_API_KEY)");
    }

    const jsonStr = extractJSON(response);
    const data = JSON.parse(jsonStr);

    if (!validateSOAPData(data)) {
      console.error("Dados SOAP inválidos, retornando estrutura vazia");
      return createEmptySOAP();
    }

    return data;
  } catch (error) {
    console.error("Erro ao gerar SOAP:", error);

    // If parsing fails, try to create a basic structure
    if (error instanceof SyntaxError) {
      console.error("Erro de parsing JSON, resposta raw:", response!);
    }

    throw error;
  }
}

export async function retryGenerateSOAP(
  transcript: string,
  maxRetries = 2
): Promise<SOAPData> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateSOAP(transcript);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Tentativa ${i + 1} falhou:`, lastError.message);
    }
  }

  throw lastError || new Error("Falha ao gerar SOAP após múltiplas tentativas");
}

// Speaker diarization types
export interface DiarizedSegment {
  speaker: "medico" | "paciente" | "desconhecido";
  text: string;
  confidence: number;
}

export interface DiarizedTranscription {
  segments: DiarizedSegment[];
  rawText: string;
}

const DIARIZATION_SYSTEM_PROMPT = `Voce e um assistente especializado em transcrições de consultas medicas.

Sua tarefa e identificar quem esta falando em cada parte da transcricao: o MEDICO ou o PACIENTE.

REGRAS:
1. O MEDICO geralmente:
   - Faz perguntas sobre sintomas, historico, medicamentos
   - Da instrucoes, orientacoes, prescricoes
   - Menciona diagnosticos, exames, tratamentos
   - Usa termos tecnicos medicos
   - Pergunta "O que voce esta sentindo?", "Ha quanto tempo?", etc.

2. O PACIENTE geralmente:
   - Descreve sintomas, dores, desconfortos
   - Responde perguntas sobre seu estado
   - Relata historico pessoal
   - Expressa preocupacoes ou duvidas
   - Usa linguagem mais informal

3. Se nao for possivel determinar com certeza, marque como "desconhecido"

4. Mantenha o texto original, apenas identifique o falante

FORMATO DE SAIDA (JSON array):
[
  {"speaker": "medico", "text": "texto da fala", "confidence": 0.9},
  {"speaker": "paciente", "text": "texto da fala", "confidence": 0.85},
  ...
]

Retorne APENAS o JSON, sem markdown ou explicacoes.`;

const DIARIZATION_USER_PROMPT = `Analise esta transcricao de consulta medica e identifique quem esta falando em cada parte.
Separe por turnos de fala (quando muda de pessoa).

TRANSCRICAO:
`;

async function diarizeWithOpenAI(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: DIARIZATION_SYSTEM_PROMPT },
      { role: "user", content: DIARIZATION_USER_PROMPT + transcript },
    ],
    temperature: 0.2,
    max_tokens: 4000,
  });

  return response.choices[0]?.message?.content || "[]";
}

async function diarizeWithAnthropic(transcript: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    system: DIARIZATION_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: DIARIZATION_USER_PROMPT + transcript },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "[]";
}

function extractJSONArray(text: string): string {
  // Try to find JSON array in the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return "[]";
}

function validateDiarizedSegment(seg: unknown): seg is DiarizedSegment {
  if (typeof seg !== "object" || seg === null) return false;
  const obj = seg as Record<string, unknown>;
  return (
    (obj.speaker === "medico" ||
      obj.speaker === "paciente" ||
      obj.speaker === "desconhecido") &&
    typeof obj.text === "string" &&
    typeof obj.confidence === "number"
  );
}

export async function diarizeTranscription(
  transcript: string
): Promise<DiarizedTranscription> {
  if (!transcript.trim()) {
    return { segments: [], rawText: transcript };
  }

  let response: string;

  try {
    if (LLM_PROVIDER === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      response = await diarizeWithAnthropic(transcript);
    } else if (process.env.OPENAI_API_KEY) {
      response = await diarizeWithOpenAI(transcript);
    } else {
      // Fallback: return simple segments without speaker identification
      return {
        segments: transcript
          .split(/\n+/)
          .filter((line) => line.trim())
          .map((text) => ({
            speaker: "desconhecido" as const,
            text: text.trim(),
            confidence: 0.5,
          })),
        rawText: transcript,
      };
    }

    const jsonStr = extractJSONArray(response);
    const data = JSON.parse(jsonStr);

    if (!Array.isArray(data)) {
      throw new Error("Resposta nao e um array");
    }

    const validSegments: DiarizedSegment[] = data
      .filter(validateDiarizedSegment)
      .map((seg) => ({
        speaker: seg.speaker,
        text: seg.text,
        confidence: Math.max(0, Math.min(1, seg.confidence)),
      }));

    if (validSegments.length === 0) {
      // If no valid segments, fallback to simple parsing
      return {
        segments: transcript
          .split(/\n+/)
          .filter((line) => line.trim())
          .map((text) => ({
            speaker: "desconhecido" as const,
            text: text.trim(),
            confidence: 0.5,
          })),
        rawText: transcript,
      };
    }

    return {
      segments: validSegments,
      rawText: transcript,
    };
  } catch (error) {
    console.error("Erro ao diarizar transcricao:", error);

    // Fallback: return simple segments without speaker identification
    return {
      segments: transcript
        .split(/\n+/)
        .filter((line) => line.trim())
        .map((text) => ({
          speaker: "desconhecido" as const,
          text: text.trim(),
          confidence: 0.5,
        })),
      rawText: transcript,
    };
  }
}
