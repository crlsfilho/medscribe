import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectActionableItems } from "@/lib/active-agent";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const { visitId } = await request.json();

    if (!visitId) {
      return NextResponse.json(
        { error: "visitId e obrigatorio" },
        { status: 400 }
      );
    }

    // Fetch visit with SOAP data
    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        userId: session.user.id,
      },
      include: {
        patient: true,
      },
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Consulta nao encontrada" },
        { status: 404 }
      );
    }

    if (!visit.soapJson && !visit.transcriptText) {
      return NextResponse.json(
        { error: "Consulta sem dados para analise" },
        { status: 400 }
      );
    }

    // Run detection
    const detectedItems = await detectActionableItems(
      visit.soapJson || "{}",
      visit.transcriptText || "",
      visitId
    );

    if (detectedItems.length === 0) {
      return NextResponse.json({
        items: [],
        message: "Nenhuma acao detectada",
      });
    }

    // Save items to database
    const savedItems = await Promise.all(
      detectedItems.map(async (item) => {
        const saved = await prisma.actionableItem.create({
          data: {
            visitId,
            type: item.type,
            confidence: item.confidence,
            sourceText: item.sourceText,
            status: "suggested",
            metadata: JSON.stringify(item.metadata),
          },
        });

        return {
          ...saved,
          metadata: item.metadata,
        };
      })
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        visitId,
        action: "active_agent_detected",
        details: `Detectados ${savedItems.length} itens acionaveis`,
      },
    });

    return NextResponse.json({
      items: savedItems,
      count: savedItems.length,
    });
  } catch (error) {
    console.error("Erro na deteccao do Active Agent:", error);
    return NextResponse.json(
      { error: "Erro ao processar deteccao" },
      { status: 500 }
    );
  }
}
