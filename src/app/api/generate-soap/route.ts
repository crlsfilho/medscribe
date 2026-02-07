import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retryGenerateSOAP } from "@/lib/llm";
import { normalizeTerms } from "@/lib/normalize";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { visitId } = await request.json();

    if (!visitId) {
      return NextResponse.json(
        { error: "ID da consulta é obrigatório" },
        { status: 400 }
      );
    }

    // Get visit with transcript
    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        userId: session.user.id,
      },
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    if (!visit.transcriptText) {
      return NextResponse.json(
        { error: "Nenhuma transcrição encontrada para esta consulta" },
        { status: 400 }
      );
    }

    // Generate SOAP note
    const soapData = await retryGenerateSOAP(visit.transcriptText);

    // Normalize mentions (CID-10 and DCB)
    const suggestions = await normalizeTerms(soapData.mentions, visitId);

    // Save suggestions to database
    if (suggestions.length > 0) {
      await prisma.normalizationSuggestion.createMany({
        data: suggestions.map((s) => ({
          visitId,
          type: s.type,
          rawText: s.rawText,
          normalizedCode: s.normalizedCode,
          normalizedLabel: s.normalizedLabel,
          confidence: s.confidence,
        })),
      });
    }

    // Update visit with SOAP data
    const soapJson = JSON.stringify(soapData);
    const soapText = formatSOAPText(soapData);

    await prisma.visit.update({
      where: { id: visitId },
      data: { soapJson, soapText },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        visitId,
        action: "generated_soap",
        details: "Nota SOAP gerada com sucesso",
      },
    });

    return NextResponse.json({
      soap: soapData,
      suggestions,
    });
  } catch (error) {
    console.error("Erro ao gerar SOAP:", error);

    // Check for specific errors
    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("chave")) {
        return NextResponse.json(
          { error: "Chave de API não configurada. Configure OPENAI_API_KEY ou ANTHROPIC_API_KEY no arquivo .env" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro ao gerar nota SOAP. Tente novamente." },
      { status: 500 }
    );
  }
}

function formatSOAPText(soap: {
  subjective: { chiefComplaint: string; historyPresentIllness: string };
  objective: { vitalSigns: string; physicalExam: string; labResults: string };
  assessment: { diagnoses: string[]; differentials: string[] };
  plan: { medications: string[]; procedures: string[]; instructions: string[]; followUp: string };
}): string {
  let text = "NOTA CLÍNICA - FORMATO SOAP\n\n";

  text += "=== SUBJETIVO (S) ===\n";
  if (soap.subjective.chiefComplaint) {
    text += `Queixa Principal: ${soap.subjective.chiefComplaint}\n`;
  }
  if (soap.subjective.historyPresentIllness) {
    text += `História da Doença Atual: ${soap.subjective.historyPresentIllness}\n`;
  }
  text += "\n";

  text += "=== OBJETIVO (O) ===\n";
  if (soap.objective.vitalSigns) {
    text += `Sinais Vitais: ${soap.objective.vitalSigns}\n`;
  }
  if (soap.objective.physicalExam) {
    text += `Exame Físico: ${soap.objective.physicalExam}\n`;
  }
  if (soap.objective.labResults) {
    text += `Exames: ${soap.objective.labResults}\n`;
  }
  text += "\n";

  text += "=== AVALIAÇÃO (A) ===\n";
  if (soap.assessment.diagnoses.length > 0) {
    text += `Diagnósticos: ${soap.assessment.diagnoses.join(", ")}\n`;
  }
  if (soap.assessment.differentials.length > 0) {
    text += `Diagnósticos Diferenciais: ${soap.assessment.differentials.join(", ")}\n`;
  }
  text += "\n";

  text += "=== PLANO (P) ===\n";
  if (soap.plan.medications.length > 0) {
    text += `Medicamentos: ${soap.plan.medications.join("; ")}\n`;
  }
  if (soap.plan.procedures.length > 0) {
    text += `Procedimentos: ${soap.plan.procedures.join("; ")}\n`;
  }
  if (soap.plan.instructions.length > 0) {
    text += `Orientações: ${soap.plan.instructions.join("; ")}\n`;
  }
  if (soap.plan.followUp) {
    text += `Retorno: ${soap.plan.followUp}\n`;
  }

  return text;
}
