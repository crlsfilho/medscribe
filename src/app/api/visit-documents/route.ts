import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saveDocumentSchema = z.object({
  visitId: z.string(),
  type: z.enum(["prescription", "exam", "certificate", "diagnoses"]),
  content: z.any(), // The structured JSON from the LLM
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { visitId, type, content } = saveDocumentSchema.parse(body);

    // Verify visit belongs to user
    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        userId: session.user.id,
      },
      include: {
        patient: true,
      }
    });

    if (!visit) {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

    // Create ActionableItem (Document)
    // We map the internal type to the ActionableItem types
    // Since ActionableItem type was "tiss_form" | "referral_letter" | "follow_up"
    // I will use more descriptive types and handle them in the portal if needed
    // or just use descriptive names.
    
    let docTitle = "";
    switch(type) {
        case "prescription": docTitle = "Receita Médica"; break;
        case "exam": docTitle = "Pedido de Exames"; break;
        case "certificate": docTitle = "Atestado Médico"; break;
        case "diagnoses": docTitle = "Hipóteses Diagnósticas"; break;
    }

    const actionableItem = await prisma.actionableItem.create({
      data: {
        visitId,
        type: type,
        status: "completed",
        confidence: 1.0,
        sourceText: `Documento ${type} gerado manualmente pelo médico.`,
        completedAt: new Date(),
        metadata: JSON.stringify({
          filename: `${docTitle} - ${visit.patient.name}.pdf`,
          docType: type,
          data: content,
          savedAt: new Date().toISOString(),
        }),
      },
    });

    // Also update Visit portal fields if applicable
    if (type === "prescription" && content.medications) {
        await prisma.visit.update({
            where: { id: visitId },
            data: {
                carePlan: JSON.stringify(content.medications.map((m: any) => ({
                    medication: m.name,
                    instructions: `${m.dosage ? m.dosage + " - " : ""}${m.instructions}`
                })))
            }
        });
    }

    // Add Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        visitId,
        action: "document_saved",
        details: `${docTitle} salvo para o paciente ${visit.patient.name}`,
      },
    });

    return NextResponse.json({ success: true, item: actionableItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Erro ao salvar documento:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
