import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // Verify suggestion belongs to user's visit
    const suggestion = await prisma.normalizationSuggestion.findFirst({
      where: { id },
      include: {
        visit: true,
      },
    });

    if (!suggestion || suggestion.visit.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sugestão não encontrada" },
        { status: 404 }
      );
    }

    const updated = await prisma.normalizationSuggestion.update({
      where: { id },
      data: { accepted: body.accepted },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar sugestão:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar sugestão" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify suggestion belongs to user's visit
    const suggestion = await prisma.normalizationSuggestion.findFirst({
      where: { id },
      include: {
        visit: true,
      },
    });

    if (!suggestion || suggestion.visit.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sugestão não encontrada" },
        { status: 404 }
      );
    }

    await prisma.normalizationSuggestion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar sugestão:", error);
    return NextResponse.json(
      { error: "Erro ao deletar sugestão" },
      { status: 500 }
    );
  }
}
