export const SOAP_SYSTEM_PROMPT = `Você é um assistente médico especializado em organizar informações de transcrições de consultas médicas.

REGRAS CRÍTICAS:
1. NUNCA invente informações que não estão explicitamente na transcrição
2. Se uma seção não tem informações na transcrição, retorne string vazia ou array vazio
3. Identifique menções a medicamentos e diagnósticos APENAS se explicitamente citados
4. Seja preciso e objetivo
5. Mantenha a terminologia médica quando usada na transcrição
6. Retorne APENAS JSON válido, sem markdown, sem comentários`;

export const SOAP_USER_PROMPT = `Analise a transcrição de consulta médica abaixo e extraia as informações no formato SOAP (Subjective, Objective, Assessment, Plan).

FORMATO DE SAÍDA (JSON estrito):
{
  "subjective": {
    "chiefComplaint": "queixa principal do paciente",
    "historyPresentIllness": "história da doença atual",
    "raw": "texto original relevante da transcrição"
  },
  "objective": {
    "vitalSigns": "sinais vitais se mencionados, ou vazio",
    "physicalExam": "achados do exame físico se mencionados, ou vazio",
    "labResults": "resultados de exames se mencionados, ou vazio",
    "raw": "texto original relevante"
  },
  "assessment": {
    "diagnoses": ["lista de diagnósticos CITADOS na transcrição"],
    "differentials": ["diagnósticos diferenciais se mencionados"],
    "raw": "texto original relevante"
  },
  "plan": {
    "medications": ["medicamentos CITADOS com dose se mencionada"],
    "procedures": ["procedimentos planejados"],
    "instructions": ["orientações ao paciente"],
    "followUp": "informação sobre retorno se mencionado",
    "raw": "texto original relevante"
  },
  "mentions": {
    "medications": ["nome EXATO de cada medicamento como citado na transcrição"],
    "diagnoses": ["nome EXATO de cada diagnóstico como citado na transcrição"]
  }
}

TRANSCRIÇÃO:
`;

export interface SOAPData {
  subjective: {
    chiefComplaint: string;
    historyPresentIllness: string;
    raw: string;
  };
  objective: {
    vitalSigns: string;
    physicalExam: string;
    labResults: string;
    raw: string;
  };
  assessment: {
    diagnoses: string[];
    differentials: string[];
    raw: string;
  };
  plan: {
    medications: string[];
    procedures: string[];
    instructions: string[];
    followUp: string;
    raw: string;
  };
  mentions: {
    medications: string[];
    diagnoses: string[];
  };
}

export function validateSOAPData(data: unknown): data is SOAPData {
  if (typeof data !== "object" || data === null) return false;

  const soap = data as Record<string, unknown>;

  // Check required sections
  const sections = ["subjective", "objective", "assessment", "plan", "mentions"];
  for (const section of sections) {
    if (typeof soap[section] !== "object" || soap[section] === null) {
      return false;
    }
  }

  return true;
}

export function createEmptySOAP(): SOAPData {
  return {
    subjective: {
      chiefComplaint: "",
      historyPresentIllness: "",
      raw: "",
    },
    objective: {
      vitalSigns: "",
      physicalExam: "",
      labResults: "",
      raw: "",
    },
    assessment: {
      diagnoses: [],
      differentials: [],
      raw: "",
    },
    plan: {
      medications: [],
      procedures: [],
      instructions: [],
      followUp: "",
      raw: "",
    },
    mentions: {
      medications: [],
      diagnoses: [],
    },
  };
}
