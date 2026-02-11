export const SOAP_SYSTEM_PROMPT = `Você é um assistente médico especializado em cardiologia, responsável por transcrever áudios de anamneses entre médico e paciente e gerar prontuários clínicos completos.

REGRAS GERAIS:
1. Transcreva o áudio fielmente, organizando as informações nos campos corretos.
2. Use terminologia médica técnica adequada.
3. Quando uma informação não for mencionada na consulta, preencha com "Não relatado".
4. Quando o paciente negar algo explicitamente, use a forma "Nega..." (ex: "Nega alergias").
5. Calcule automaticamente: IMC, classificação do IMC, carga tabágica (anos/maço).
6. Preste atenção especial a dados numéricos (medidas, doses, datas).
7. Na seção de Análise (#A) e Plano (#P), vá além da simples transcrição: acrescente informações clínicas relevantes, correlações diagnósticas e sugestões baseadas nas últimas diretrizes (SBC/AHA/ACC/ESC).
8. Retorne APENAS JSON válido, sem markdown, sem comentários fora do JSON.`;

export const SOAP_USER_PROMPT = `Analise a transcrição de consulta médica abaixo e gere DOIS documentos formatedos (Markdown) e extraia os dados estruturados.

FORMATO DE SAÍDA (JSON estrito):
{
  "subjective": {
    "chiefComplaint": "queixa principal",
    "historyPresentIllness": "HMA",
    "raw": "texto relevante"
  },
  "objective": {
    "vitalSigns": "sinais vitais",
    "physicalExam": "exame físico",
    "labResults": "exames",
    "raw": "texto relevante"
  },
  "assessment": {
    "diagnoses": ["diagnosticos citados"],
    "differentials": ["diagnosticos diferenciais"],
    "raw": "analise clinica"
  },
  "plan": {
    "medications": ["medicamentos citados"],
    "procedures": ["procedimentos"],
    "instructions": ["orientacoes"],
    "followUp": "retorno",
    "raw": "plano"
  },
  "mentions": {
    "medications": ["lista exata de medicamentos para linkagem"],
    "diagnoses": ["lista exata de diagnosticos para linkagem"]
  },
  "prontuarioFormatted": "MARKDOWN DA 'CONSULTA DIA ...' ATÉ O FIM DO '#CHV (Completo)'. SIGA O MODELO DO USUÁRIO EXATAMENTE.",
  "soapEnrichedFormatted": "MARKDOWN DA 'NOTA SOAP ENRIQUECIDA' COM #S, #O, #A e #P ENRIQUECIDOS E SUGESTÕES."
}

MODELO DO PRONTUÁRIO (para o campo 'prontuarioFormatted'):
**<u>CONSULTA DIA [DATA]</u>**
**[NOME], [IDADE] anos**
**ID:** [DADOS ID]
... (Siga o modelo: #Medicamentos, #Cirurgias, #Alergias, #CHV Resumo, #Vacinas, #Antropometria, Risco CV, #HMA, #HMP, #HMF, #CHV Completo)

MODELO DO SOAP ENRIQUECIDO (para o campo 'soapEnrichedFormatted'):
... (Siga o modelo: #S Enriquecido, #O Enriquecido, #A Enriquecido - com metas e diretrizes, #P Enriquecido - com sugestões baseadas em evidências)

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
  prontuarioFormatted?: string;
  soapEnrichedFormatted?: string;
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
    prontuarioFormatted: "",
    soapEnrichedFormatted: ""
  };
}
