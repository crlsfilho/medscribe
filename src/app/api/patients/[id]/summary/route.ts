import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        visits: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    if (patient.visits.length === 0) {
       return NextResponse.json({ 
         clinicalSummary: "Paciente ainda não possui histórico de consultas no sistema.",
         conditions: "[]"
       });
    }

    // Accumulate history
    const historyText = patient.visits
      .map((v, i) => `Visita ${i+1} (${v.createdAt.toISOString().split("T")[0]}):\n${v.soapText || v.transcriptText || "Sem registros textuais."}`)
      .join("\n\n---\n\n");

    const prompt = `Você é um assistente clínico de inteligência artificial analisando o histórico de consultas de um paciente.
Baseado EXCLUSIVAMENTE nas transcrições e notas abaixo, produza um JSON com dois campos:
1. "clinicalSummary": Um resumo em texto contínuo, em no máximo 2 linhas (bem conciso), sobre o estado de saúde do paciente e os tratamentos em andamento.
2. "conditions": Um array de strings representando as principais condições crônicas ou diagnósticos identificados (ex: ["Hipertensão", "Ansiedade']). Se não houver, retorne uma lista vazia.

Responda APENAS com o JSON válido.

HISTÓRICO:
${historyText}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um assistente médico conciso e objetivo. Responda apenas com o JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const aiText = response.choices[0]?.message?.content || "{}";
    
    // Extract JSON block in case there's markdown wrapping
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : aiText;
    
    let result = { clinicalSummary: "", conditions: [] };
    try {
        result = JSON.parse(jsonStr);
    } catch(e) {
        console.error("Falha ao parsear JSON da IA:", e);
    }

    // Save to DB
    const updatedPatient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
            clinicalSummary: result.clinicalSummary || "Resumo não disponível.",
            conditions: JSON.stringify(result.conditions || []),
        }
    });

    return NextResponse.json({
        clinicalSummary: updatedPatient.clinicalSummary,
        conditions: updatedPatient.conditions
    });

  } catch (error) {
    console.error("Erro ao gerar resumo da IA:", error);
    return NextResponse.json(
      { error: "Erro ao gerar resumo do paciente" },
      { status: 500 }
    );
  }
}
