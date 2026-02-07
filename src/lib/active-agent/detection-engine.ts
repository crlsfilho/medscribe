import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { buildDetectionPrompt } from "./prompts";
import { matchProceduresToTuss } from "./tuss-matcher";
import {
  ActionableItem,
  TissMetadata,
  DetectionResult,
  DetectedProcedure,
} from "@/types/active-agent";

const LLM_PROVIDER = process.env.LLM_PROVIDER || "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract detection results from LLM response
 */
function parseDetectionResponse(response: string): DetectionResult {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { procedures: [], referrals: [], followUps: [] };
    }

    const data = JSON.parse(jsonMatch[0]);

    return {
      procedures: Array.isArray(data.procedures) ? data.procedures : [],
      referrals: Array.isArray(data.referrals) ? data.referrals : [],
      followUps: Array.isArray(data.followUps) ? data.followUps : [],
    };
  } catch (error) {
    console.error("Erro ao parsear resposta de deteccao:", error);
    return { procedures: [], referrals: [], followUps: [] };
  }
}

/**
 * Call OpenAI for detection
 */
async function detectWithOpenAI(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Voce e um assistente medico que extrai informacoes de consultas. Retorne sempre JSON valido.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "{}";
}

/**
 * Call Anthropic for detection
 */
async function detectWithAnthropic(prompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    system:
      "Voce e um assistente medico que extrai informacoes de consultas. Retorne sempre JSON valido.",
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "{}";
}

/**
 * Main detection function - extracts actionable items from SOAP/transcript
 */
export async function detectActionableItems(
  soapJson: string,
  transcript: string,
  visitId: string
): Promise<ActionableItem[]> {
  const items: ActionableItem[] = [];

  // Build prompt
  const prompt = buildDetectionPrompt(soapJson, transcript, false);

  // Call LLM
  let response: string;
  try {
    if (LLM_PROVIDER === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      response = await detectWithAnthropic(prompt);
    } else if (process.env.OPENAI_API_KEY) {
      response = await detectWithOpenAI(prompt);
    } else {
      console.error("Nenhuma API key configurada para deteccao");
      return [];
    }
  } catch (error) {
    console.error("Erro ao chamar LLM para deteccao:", error);
    return [];
  }

  // Parse response
  const detectionResult = parseDetectionResponse(response);

  // Process procedures -> TISS items
  if (detectionResult.procedures.length > 0) {
    const tissItem = createTissActionableItem(
      detectionResult.procedures,
      visitId,
      soapJson
    );
    if (tissItem) {
      items.push(tissItem);
    }
  }

  return items;
}

/**
 * Create a TISS actionable item from detected procedures
 */
function createTissActionableItem(
  procedures: DetectedProcedure[],
  visitId: string,
  soapJson: string
): ActionableItem | null {
  if (procedures.length === 0) return null;

  // Match procedures to TUSS codes
  const tussProcedures = matchProceduresToTuss(procedures);

  if (tussProcedures.length === 0) return null;

  // Try to extract CID from SOAP
  let cidCode: string | undefined;
  let cidDescription: string | undefined;

  try {
    const soap = JSON.parse(soapJson);
    if (soap.assessment?.diagnoses?.length > 0) {
      // Use first diagnosis as CID reference
      cidDescription = soap.assessment.diagnoses[0];
    }
  } catch {
    // Ignore parsing errors
  }

  // Calculate overall confidence
  const avgConfidence =
    tussProcedures.reduce((sum, p) => sum + p.matchConfidence, 0) /
    tussProcedures.length;

  // Determine urgency (use most urgent from procedures)
  const urgencyMap = { emergency: 3, urgent: 2, routine: 1 };
  const maxUrgency = procedures.reduce((max, p) => {
    return urgencyMap[p.urgency] > urgencyMap[max] ? p.urgency : max;
  }, "routine" as "routine" | "urgent" | "emergency");

  // Combine source texts
  const sourceText = procedures.map((p) => p.sourceText).join("; ");

  const metadata: TissMetadata = {
    procedureCodes: tussProcedures,
    cidCode,
    cidDescription,
    urgency: maxUrgency,
  };

  return {
    id: `temp-${Date.now()}`, // Will be replaced by database ID
    visitId,
    type: "tiss_form",
    confidence: avgConfidence,
    sourceText: sourceText.slice(0, 500), // Limit text length
    status: "suggested",
    createdAt: new Date(),
    metadata,
  };
}

/**
 * Quick detection - only checks for procedures (faster, MVP)
 */
export async function quickDetectProcedures(
  soapJson: string,
  transcript: string
): Promise<DetectedProcedure[]> {
  const prompt = buildDetectionPrompt(soapJson, transcript, false);

  let response: string;
  try {
    if (LLM_PROVIDER === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      response = await detectWithAnthropic(prompt);
    } else if (process.env.OPENAI_API_KEY) {
      response = await detectWithOpenAI(prompt);
    } else {
      return [];
    }
  } catch (error) {
    console.error("Erro na deteccao rapida:", error);
    return [];
  }

  const result = parseDetectionResponse(response);
  return result.procedures;
}
