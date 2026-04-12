export const SOAP_SYSTEM_PROMPT = `Você é um assistente médico especializado em cardiologia, responsável por transcrever áudios de anamneses entre médico e paciente e gerar prontuários clínicos completos.

REGRAS GERAIS:
1. Transcreva o áudio fielmente, organizando as informações nos campos corretos.
2. Use terminologia médica técnica adequada.
3. Quando uma informação não for explícita nem discutida na consulta, o valor do JSON deve ser ABSOLUTAMENTE \`null\`.
4. IMPORTANTÍSSIMO: Campos negados ativamente pelo paciente (ex: "tem alergia?" -> "não") NÃO SÃO \`null\`. Eles devem conter a frase de negação (ex: "Nega de alergias").
5. Calcule automaticamente: IMC, classificação do IMC, carga tabágica (anos/maço).
6. Preste atenção especial a dados numéricos (medidas, doses, datas).
7. Para a ação de medicações no Plano, use estritamente: "iniciar", "manter", "ajustar" ou "suspender".
8. Retorne APENAS JSON válido, sem markdown, sem comentários fora do JSON.`;

export const SOAP_USER_PROMPT = `Analise a transcrição de consulta médica abaixo e gere DOIS documentos formatedos (Markdown) e extraia os dados estruturados.

FORMATO DE SAÍDA EXIGIDO (JSON estrito):
{
  "subjective": {
    "chiefComplaint": "queixa principal",
    "historyPresentIllness": "HMA",
    "pastMedicalHistory": "doenças prévias, cirurgias, internações, alergias. null se não citado. 'Nega alergias' se negado.",
    "familyHistory": "doenças na família. null se não citado",
    "socialHistory": "tabagismo, etilismo, estilo de vida. null se não citado",
    "reviewOfSystems": "sinais e sintomas nos aparelhos fora da HMA. null se não citado",
    "raw": "texto estruturado subjetivo"
  },
  "objective": {
    "vitalSigns": "sinais vitais",
    "physicalExam": "exame físico",
    "labResults": "exames interpretados/trazidos",
    "raw": "texto objetivo"
  },
  "assessment": {
    "activeProblems": [
      {
        "name": "nome do problema/doença ativa",
        "status": "ativo|controlado|em investigação|resolvido"
      }
    ],
    "encounterDiagnoses": ["diagnósticos conclusivos do dia de hoje"],
    "differentials": ["diagnosticos diferenciais"],
    "clinicalReasoning": "texto livre conectando dados a favor e contra para explicar a linha de raciocínio. null se óbvio demais sem justificativa mair",
    "raw": "analise clinica estruturada"
  },
  "plan": {
    "therapeuticGoals": "metas mensuráveis (ex: PA < 130/80 em 30d). null se n/a",
    "medications": [
      {
        "name": "nome do medicamento longo/posologia",
        "action": "iniciar|manter|ajustar|suspender"
      }
    ],
    "procedures": ["procedimentos"],
    "instructions": ["orientacoes"],
    "followUp": "retorno",
    "raw": "plano detalhado"
  },
  "mentions": {
    "medications": ["lista extata de drogas ativas isoladas para linkagem. apenas nomes limpos"],
    "diagnoses": ["lista exata de CIDs citados purificados"],
    "labTests": ["lista de nomes de exames purificados, sejam novos pedidos ou resultados antigos lidos"]
  },
  "prontuarioFormatted": "MARKDOWN",
  "soapEnrichedFormatted": "MARKDOWN"
}

TRANSCRIÇÃO:
`;

export interface ActiveProblem {
  name: string;
  status: "ativo" | "controlado" | "em investigação" | "resolvido";
}

export interface MedicationAction {
  name: string;
  action: "iniciar" | "manter" | "ajustar" | "suspender";
}

export interface SOAPData {
  subjective: {
    chiefComplaint: string;
    historyPresentIllness: string;
    pastMedicalHistory: string | null;
    familyHistory: string | null;
    socialHistory: string | null;
    reviewOfSystems: string | null;
    raw: string;
  };
  objective: {
    vitalSigns: string;
    physicalExam: string;
    labResults: string;
    raw: string;
  };
  assessment: {
    activeProblems: ActiveProblem[];
    encounterDiagnoses: string[];
    differentials: string[];
    clinicalReasoning: string | null;
    raw: string;
    diagnoses?: string[]; // Legacy fallback
  };
  plan: {
    therapeuticGoals: string | null;
    medications: MedicationAction[] | string[]; // Suporte Legacy
    procedures: string[];
    instructions: string[];
    followUp: string;
    raw: string;
  };
  mentions: {
    medications: string[];
    diagnoses: string[];
    labTests: string[];
  };
  prontuarioFormatted?: string;
  soapEnrichedFormatted?: string;
}

export function validateSOAPData(data: unknown): data is SOAPData {
  if (typeof data !== "object" || data === null) return false;

  const soap = data as Record<string, unknown>;

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
      pastMedicalHistory: null,
      familyHistory: null,
      socialHistory: null,
      reviewOfSystems: null,
      raw: "",
    },
    objective: {
      vitalSigns: "",
      physicalExam: "",
      labResults: "",
      raw: "",
    },
    assessment: {
      activeProblems: [],
      encounterDiagnoses: [],
      differentials: [],
      clinicalReasoning: null,
      raw: "",
    },
    plan: {
      therapeuticGoals: null,
      medications: [],
      procedures: [],
      instructions: [],
      followUp: "",
      raw: "",
    },
    mentions: {
      medications: [],
      diagnoses: [],
      labTests: [],
    },
    prontuarioFormatted: "",
    soapEnrichedFormatted: ""
  };
}

