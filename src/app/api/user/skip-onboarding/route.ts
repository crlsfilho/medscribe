import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingComplete: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "skipped_onboarding",
        details: `O usuário optou por pular o onboarding.`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao pular onboarding:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
