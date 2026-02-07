import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const visitId = searchParams.get("visitId");

  if (!visitId) {
    return NextResponse.json(
      { error: "visitId e obrigatorio" },
      { status: 400 }
    );
  }

  try {
    // Verify visit belongs to user
    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        userId: session.user.id,
      },
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Consulta nao encontrada" },
        { status: 404 }
      );
    }

    // Get actionable items
    const items = await prisma.actionableItem.findMany({
      where: {
        visitId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse metadata for each item
    const itemsWithMetadata = items.map((item: any) => ({
      ...item,
      metadata: JSON.parse(item.metadata),
    }));

    return NextResponse.json({
      items: itemsWithMetadata,
      count: items.length,
    });
  } catch (error) {
    console.error("Erro ao listar itens:", error);
    return NextResponse.json(
      { error: "Erro ao listar itens" },
      { status: 500 }
    );
  }
}
