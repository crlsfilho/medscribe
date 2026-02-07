import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const item = await prisma.actionableItem.findUnique({
      where: { id },
      include: {
        visit: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item nao encontrado" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (item.visit.userId !== session.user.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
    }

    return NextResponse.json({
      ...item,
      metadata: JSON.parse(item.metadata),
    });
  } catch (error) {
    console.error("Erro ao buscar item:", error);
    return NextResponse.json(
      { error: "Erro ao buscar item" },
      { status: 500 }
    );
  }
}

// PATCH - Update item status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !["suggested", "accepted", "dismissed", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Status invalido" },
        { status: 400 }
      );
    }

    // Verify item exists and belongs to user
    const existingItem = await prisma.actionableItem.findUnique({
      where: { id },
      include: {
        visit: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item nao encontrado" },
        { status: 404 }
      );
    }

    if (existingItem.visit.userId !== session.user.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
    }

    // Update item
    const updatedItem = await prisma.actionableItem.update({
      where: { id },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        visitId: existingItem.visitId,
        action: `active_agent_${status}`,
        details: `Item ${existingItem.type} marcado como ${status}`,
      },
    });

    return NextResponse.json({
      ...updatedItem,
      metadata: JSON.parse(updatedItem.metadata),
    });
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar item" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify item exists and belongs to user
    const existingItem = await prisma.actionableItem.findUnique({
      where: { id },
      include: {
        visit: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item nao encontrado" },
        { status: 404 }
      );
    }

    if (existingItem.visit.userId !== session.user.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
    }

    await prisma.actionableItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar item:", error);
    return NextResponse.json(
      { error: "Erro ao deletar item" },
      { status: 500 }
    );
  }
}
