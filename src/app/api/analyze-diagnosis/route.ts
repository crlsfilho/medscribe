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
        const { transcript, soapContext } = await request.json();

        if (!transcript && !soapContext) {
            return NextResponse.json({ error: "Contexto insuficiente (transcrição ou SOAP necessários)" }, { status: 400 });
        }

        const systemPrompt = `Você é um Assistente de Diagnóstico Médico Sênior.
        SUA MISSÃO: Analisar a transcrição da consulta e/ou o SOAP parcial para sugerir hipóteses diagnósticas fundamentadas.

        FORMATO DE SAÍDA (JSON Obrigatório):
        {
            "hypotheses": [
                {
                    "name": "Nome da Doença",
                    "probability": "Alta" | "Média" | "Baixa",
                    "reasoning": "Texto explicativo curto focando nos sintomas presentes.",
                    "criticism": "Fatores que falam contra ou dados faltantes.",
                    "search_terms": "Termos otimizados para busca no PubMed"
                }
            ],
            "alert_flags": ["Sinais de alerta/Red flags se houver"]
        }

        DIRETRIZES:
        1. Liste no máximo 3 hipóteses principais.
        2. Seja conservador. Se houver dúvida, sugira exames ou mais anamnese.
        3. Para "search_terms", use termos Mesh ou palavras-chave em INGLÊS para melhor resultado no PubMed (ex: "Dengue Fever guidelines", "Acute Appendicitis management").
        4. O raciocínio deve ser direto: "Paciente relata X, Y e Z, compatível com quadro viral."`;

        const userContent = `Transcrição: "${transcript?.slice(0, 3000) || "N/A"}"
        
        Contexto SOAP Atual:
        ${JSON.stringify(soapContext || {}, null, 2)}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", // Using a smarter model for reasoning
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const data = JSON.parse(response.choices[0]?.message?.content || "{}");

        return NextResponse.json(data);

    } catch (error) {
        console.error("Erro na API de Diagnóstico:", error);
        return NextResponse.json(
            { error: "Erro ao analisar diagnóstico" },
            { status: 500 }
        );
    }
}
