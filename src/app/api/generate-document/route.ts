import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const { type, soapContext, instruction } = await request.json(); // instruction is optional now if context is strong

        if (!type || !soapContext) {
            return NextResponse.json({ error: "Contexto ou tipo faltando" }, { status: 400 });
        }

        const basePrompt = `Você é um assistente administrativo médico.
        CONTEXTO ATUAL (SOAP):
        - Queixa: ${soapContext.subjective?.chiefComplaint || "N/A"}
        - Diagnóstico: ${JSON.stringify(soapContext.assessment?.diagnoses || [])}
        - Medicamentos Sugeridos (Plano): ${JSON.stringify(soapContext.plan?.medications || [])}
        - Instrução Extra do Usuário: "${instruction || "Utilize os medicamentos do plano"}"
        `;

        let specificPrompt = "";

        if (type === "prescription") {
            specificPrompt = `
            ACAO: Gerar uma Receita Médica Estruturada.
            COMPORTAMENTO (IMPORTANTE):
            1. Se houver medicamentos no PLANO SOAP, use-os.
            2. Se o PLANO estiver vazio ou INCOMPLETO, SUGIRA o tratamento padrão para o Diagnóstico/Sintomas citados (ex: Para Amigdalite Bacteriana -> Sugira Amoxicilina).
            3. Priorize medicamentos disponíveis no Brasil/SUS (Denominação Comum Brasileira).
            
            SAIDA JSON OBRIGATORIA:
            {
                "medications": [
                    { "name": "Nome do remédio (Genérico/DCB preferencialmente)", "dosage": "Ex: 500mg", "instructions": "Ex: Tomar 1 comprimido de 8/8h por 7 dias" }
                ],
                "observations": "Observações gerais e não farmacológicas (ex: Hidratação, Repouso)"
            }
            `;
        } else if (type === "exam") {
            specificPrompt = `
            ACAO: Gerar um Pedido de Exames (Guia TISS/SADT compatível).
            COMPORTAMENTO:
            1. Liste exames complementares necessários para confirmar o diagnóstico ou rotina.
            2. Se o SOAP já citar exames solicitados, use-os.
            3. Se não citar, SUGIRA exames pertinentes ao quadro (ex: Dengue -> Hemograma + Plaquetas).
            4. TENTE incluir o código TUSS (Terminologia Unificada da Saúde Suplementar) para cada exame se souber.
               - Ex: Hemograma -> 40304361
               - Ex: Raio-X Tórax -> 40805018

            SAIDA JSON OBRIGATORIA:
            {
                "exams": [
                    { "name": "Nome do Exame", "tuss_code": "Código numérico ou N/A" }
                ],
                "clinical_indication": "Justificativa clínica breve (ex: Cid R50 - Febre a esclarecer)"
            }
            `;
        } else if (type === "certificate") {
            specificPrompt = `
            ACAO: Gerar um Atestado Médico.
            COMPORTAMENTO:
            1. Estime os dias de repouso necessários baseados na gravidade da doença se não especificado.
            
            SAIDA JSON OBRIGATORIA:
            {
                "days": "Número de dias (string)",
                "cid": "Código CID se houver no assessment",
                "reason": "Motivo (ex: Cid J03 - Amigdalite Aguda)",
                "full_text": "Texto formal do atestado ( Atesto para os devidos fins...)"
            }
            `;
        } else {
            specificPrompt = `
            ACAO: Gerar Documento Genérico (Encaminhamento ou Outros).
            SAIDA JSON OBRIGATORIA:
            {
                "title": "Título do Documento",
                "content": "Texto do corpo do documento formatado com \\n"
            }
            `;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: basePrompt + specificPrompt },
                { role: "user", content: "Gere o documento estruturado em JSON." },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const data = JSON.parse(response.choices[0]?.message?.content || "{}");
        return NextResponse.json({ data });

    } catch (error) {
        console.error("Erro ao gerar documento:", error);
        return NextResponse.json(
            { error: "Erro ao processar solicitação" },
            { status: 500 }
        );
    }
}
