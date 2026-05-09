import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retryGenerateSOAP, diarizeTranscription } from "@/lib/llm";
import { normalizeTerms } from "@/lib/normalize";
import { getPostHogClient } from "@/lib/posthog-server";

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

    // Phase 2: Format the text with Diarization (Medico vs Paciente)
    let finalTranscriptText = visit.transcriptText;
    
    try {
      const diarized = await diarizeTranscription(visit.transcriptText);
      // Rebuild the transcript into a formatted script
      if (diarized.segments && diarized.segments.length > 0) {
        const scriptLines = diarized.segments.map(
          (seg) => `[${seg.speaker.toUpperCase()}]: ${seg.text}`
        );
        finalTranscriptText = scriptLines.join("\n\n");
      }
    } catch (diarizeError) {
      console.error("Diarization failed, falling back to raw text:", diarizeError);
    }

    // Generate SOAP note using the properly formatted script
    const soapData = await retryGenerateSOAP(finalTranscriptText);

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

    // Prefer the enriched formatted text if available, otherwise fallback to the generated one
    const soapText = soapData.soapEnrichedFormatted
      ? `${soapData.prontuarioFormatted || ""}\n\n---\n\n${soapData.soapEnrichedFormatted}`
      : formatSOAPText(soapData);

    await prisma.visit.update({
      where: { id: visitId },
      // Save both the SOAP and the new beautifully formatted transcript script
      data: { soapJson, soapText, transcriptText: finalTranscriptText },
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

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: session.user.email ?? session.user.id,
      event: "soap_generated",
      properties: {
        visit_id: visitId,
        suggestions_count: suggestions.length,
      },
    });
    await posthog.shutdown();

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

function formatSOAPText(soap: any): string {
  let text = "NOTA CLÍNICA - FORMATO SOAP\n\n";

  text += "=== SUBJETIVO (S) ===\n";
  if (soap.subjective.chiefComplaint) text += `Queixa Principal: ${soap.subjective.chiefComplaint}\n`;
  if (soap.subjective.historyPresentIllness) text += `História da Doença Atual: ${soap.subjective.historyPresentIllness}\n`;
  if (soap.subjective.pastMedicalHistory) text += `História Mórbida Pregressa: ${soap.subjective.pastMedicalHistory}\n`;
  if (soap.subjective.familyHistory) text += `História Familiar: ${soap.subjective.familyHistory}\n`;
  if (soap.subjective.socialHistory) text += `História Social: ${soap.subjective.socialHistory}\n`;
  if (soap.subjective.reviewOfSystems) text += `Revisão por Sistemas: ${soap.subjective.reviewOfSystems}\n`;
  text += "\n";

  text += "=== OBJETIVO (O) ===\n";
  if (soap.objective.vitalSigns) text += `Sinais Vitais: ${soap.objective.vitalSigns}\n`;
  if (soap.objective.physicalExam) text += `Exame Físico: ${soap.objective.physicalExam}\n`;
  if (soap.objective.labResults) text += `Exames: ${soap.objective.labResults}\n`;
  text += "\n";

  text += "=== AVALIAÇÃO (A) ===\n";
  if (soap.assessment.activeProblems && soap.assessment.activeProblems.length > 0) {
    const problems = soap.assessment.activeProblems.map((p: any) => `${p.name} (${p.status})`);
    text += `Problemas Ativos: ${problems.join(", ")}\n`;
  }
  if (soap.assessment.encounterDiagnoses && soap.assessment.encounterDiagnoses.length > 0) {
    text += `Diagnósticos da Consulta: ${soap.assessment.encounterDiagnoses.join(", ")}\n`;
  }
  if (soap.assessment.diagnoses && soap.assessment.diagnoses.length > 0) {
    text += `Lista de Diagnósticos: ${soap.assessment.diagnoses.join(", ")}\n`;
  }
  if (soap.assessment.differentials && soap.assessment.differentials.length > 0) {
    text += `Diagnósticos Diferenciais: ${soap.assessment.differentials.join(", ")}\n`;
  }
  if (soap.assessment.clinicalReasoning) text += `Raciocínio Clínico: ${soap.assessment.clinicalReasoning}\n`;
  text += "\n";

  text += "=== PLANO (P) ===\n";
  if (soap.plan.therapeuticGoals) text += `Metas Terapêuticas: ${soap.plan.therapeuticGoals}\n`;
  
  if (soap.plan.medications && soap.plan.medications.length > 0) {
    if (typeof soap.plan.medications[0] === "string") {
        text += `Medicamentos: ${soap.plan.medications.join("; ")}\n`;
    } else {
        const meds = soap.plan.medications.map((m: any) => `[${(m.action || "MANTER").toUpperCase()}] ${m.name}`);
        text += `Medicamentos: ${meds.join("; ")}\n`;
    }
  }
  if (soap.plan.procedures && soap.plan.procedures.length > 0) {
    text += `Procedimentos: ${soap.plan.procedures.join("; ")}\n`;
  }
  if (soap.plan.instructions && soap.plan.instructions.length > 0) {
    text += `Orientações: ${soap.plan.instructions.join("; ")}\n`;
  }
  if (soap.plan.followUp) {
    text += `Retorno: ${soap.plan.followUp}\n`;
  }

  return text;
}
