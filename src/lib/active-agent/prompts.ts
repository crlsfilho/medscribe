// Prompts para o Active Agent - Deteccao de Acoes

export const PROCEDURE_DETECTION_PROMPT = `Voce e um assistente medico especializado em identificar procedimentos e exames solicitados durante consultas.

Analise os dados da consulta e extraia APENAS procedimentos/exames que foram EXPLICITAMENTE solicitados pelo medico.

REGRAS:
1. Extraia SOMENTE procedimentos que o medico disse que vai solicitar
2. Nao invente procedimentos - se nao foi mencionado, nao inclua
3. Identifique a urgencia baseado no contexto
4. Mantenha o texto original que gerou a deteccao

DADOS DA CONSULTA:

SOAP:
{soapData}

TRANSCRICAO:
{transcript}

Retorne um JSON valido com a seguinte estrutura:
{
  "procedures": [
    {
      "name": "nome do procedimento como mencionado",
      "urgency": "routine" | "urgent" | "emergency",
      "quantity": 1,
      "sourceText": "trecho exato da transcricao"
    }
  ]
}

Se nenhum procedimento foi solicitado, retorne: { "procedures": [] }

IMPORTANTE: Retorne APENAS o JSON, sem explicacoes ou markdown.`;

export const FULL_DETECTION_PROMPT = `Voce e um assistente medico especializado em identificar acoes necessarias apos uma consulta.

Analise os dados da consulta e extraia:
1. PROCEDIMENTOS/EXAMES que precisam de autorizacao (guia TISS)
2. ENCAMINHAMENTOS para especialistas
3. RETORNOS agendados

REGRAS IMPORTANTES:
- Extraia APENAS o que foi EXPLICITAMENTE mencionado
- NAO invente informacoes
- Mantenha o texto original que gerou cada deteccao

DADOS DA CONSULTA:

SOAP:
{soapData}

TRANSCRICAO:
{transcript}

Retorne um JSON valido:
{
  "procedures": [
    {
      "name": "nome do procedimento",
      "urgency": "routine" | "urgent" | "emergency",
      "quantity": 1,
      "sourceText": "trecho da transcricao"
    }
  ],
  "referrals": [
    {
      "specialty": "especialidade",
      "reason": "motivo do encaminhamento",
      "urgency": "routine" | "preferential" | "urgent",
      "sourceText": "trecho da transcricao"
    }
  ],
  "followUps": [
    {
      "timeExpression": "15 dias" | "1 mes" | etc,
      "reason": "motivo do retorno",
      "sourceText": "trecho da transcricao"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem explicacoes ou markdown.`;

// Function to build the prompt with data
export function buildDetectionPrompt(
  soapData: string,
  transcript: string,
  fullDetection = false
): string {
  const template = fullDetection
    ? FULL_DETECTION_PROMPT
    : PROCEDURE_DETECTION_PROMPT;

  return template
    .replace("{soapData}", soapData)
    .replace("{transcript}", transcript);
}
