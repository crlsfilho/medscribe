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
        const { query, context, mode } = await request.json();

        if (!query) {
            return NextResponse.json({ error: "Pergunta é obrigatória" }, { status: 400 });
        }

        // 1. Fetch OpenFDA Data (Only for Pharma mode or specific keywords)
        let fdaData = null;
        if (mode === "pharma" || query.toLowerCase().includes("interação") || query.toLowerCase().includes("efeito")) {
            try {
                // ... (Existing OpenFDA logic, simplified for brevity or kept same)
                const isDrugQuery = true; // Force check if in pharma mode
                if (isDrugQuery) {
                    const words = query.split(" ");
                    const possibleDrug = words.find((w: string) => w.length > 5 && !["interação", "efeito", "adverso", "sobre", "entre"].includes(w.toLowerCase()));

                    if (possibleDrug) {
                        const fdaRes = await fetch(`https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:${possibleDrug}&limit=3`);
                        if (fdaRes.ok) {
                            const data = await fdaRes.json();
                            if (data.results) {
                                fdaData = JSON.stringify(data.results.map((r: any) => ({
                                    reactions: r.patient.reaction.map((rx: any) => rx.reactionmeddrapt),
                                    drugs: r.patient.drug.map((d: any) => d.medicinalproduct)
                                })), null, 2);
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn("FDA Fetch Error:", err);
            }
        }

        // 2. Prepare Prompt based on Mode
        let systemPrompt = "";

        switch (mode) {
            case "pharma":
                systemPrompt = `Você é um farmacologista clínico sênior.
                SUA FUNÇÃO: Analisar interações medicamentosas, ajustes de dose e segurança.
                
                DIRETRIZES:
                1. Destaque IMEDIATAMENTE contraindicações absolutas.
                2. Cite ajustes para função renal/hepática se relevante.
                3. Use dados da FDA se fornecidos.
                
                ${fdaData ? `\n\nDADOS DA FDA (Reportados): ${fdaData}` : ""}
                `;
                break;

            case "protocols":
                systemPrompt = `Você é um especialista em Diretrizes Clínicas e Protocolos Médicos (Brasil/Internacional).
                SUA FUNÇÃO: Fornecer o "Standard of Care" para a condição perguntada.
                
                DIRETRIZES:
                1. Cite a fonte do protocolo (ex: Ministério da Saúde, SBC, AHA).
                2. Estruture em passos: Diagnóstico -> Estratificação -> Tratamento.
                3. Seja direto e prático.
                `;
                break;

            case "differential":
                systemPrompt = `Você é um mentor de Raciocínio Clínico (Dr. House, mas ético).
                SUA FUNÇÃO: Ajudar a expandir o diagnóstico diferencial.
                
                DIRETRIZES:
                1. Liste hipóteses prováveis (comuns) e "Red Flags" (graves).
                2. Para cada hipótese, diga "O que buscar" para confirmar ou descartar.
                3. Use pensamento probabilístico.
                `;
                break;

            default: // General assistant
                systemPrompt = `Você é um assistente de pesquisa clínica e evidência médica.
                SUA FUNÇÃO: Resumir diretrizes oficiais e evidências científicas.
                
                REGRAS DE OURO:
                1. NUNCA dê conduta final. Use "Diretrizes sugerem...".
                2. SEJA OBJETIVO: Use bullet points.
                3. CITE FONTES.
                `;
                break;
        }

        // Add Context and Validation Warning to all prompts
        systemPrompt += `
        ${context ? `\nCONTEXTO DO PACIENTE SELECIONADO: ${context}` : ""}
        
        AO FINAL, ADICIONE SEMPRE: "Conteúdo de apoio à decisão. A conduta é responsabilidade exclusiva do médico."
        `;

        // 3. Call OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query },
            ],
            temperature: 0.3,
            max_tokens: 800,
        });

        const answer = response.choices[0]?.message?.content || "Não consegui gerar uma resposta.";

        return NextResponse.json({
            answer,
            source: fdaData ? "OpenFDA + GPT-4 Knowledge" : "GPT-4 Knowledge Base"
        });

    } catch (error) {
        console.error("Erro na API Medical QA:", error);
        return NextResponse.json(
            { error: "Erro ao processar pergunta" },
            { status: 500 }
        );
    }
}
