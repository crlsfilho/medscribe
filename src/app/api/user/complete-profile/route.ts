import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  crm: z.string().min(4, "CRM inválido"),
  crmUf: z.string().length(2, "UF inválido"),
  specialty: z.string().min(1, "Especialidade obrigatória"),
  phoneNumber: z.string().optional(),
  clinicName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = profileSchema.parse(body);

    // Remove formatting from CPF for storage
    const cpfClean = data.cpf.replace(/\D/g, "");

    // Check if CPF already exists (unique constraint)
    const existingCPF = await prisma.user.findFirst({
      where: {
        cpf: cpfClean,
        id: { not: session.user.id },
      },
    });

    if (existingCPF) {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado" },
        { status: 400 }
      );
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        cpf: cpfClean,
        crm: data.crm,
        crmUf: data.crmUf,
        specialty: data.specialty,
        phoneNumber: data.phoneNumber || null,
        clinicName: data.clinicName || null,
        onboardingComplete: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "completed_profile",
        details: `Perfil completado: CRM ${data.crm}/${data.crmUf}, Especialidade: ${data.specialty}`,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        cpf: user.cpf,
        crm: user.crm,
        crmUf: user.crmUf,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Erro ao completar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if profile is complete
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      cpf: true,
      crm: true,
      crmUf: true,
      vidaasActive: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const isComplete = !!(user.name && user.cpf && user.crm && user.crmUf);

  return NextResponse.json({
    isComplete,
    user: {
      name: user.name,
      cpf: user.cpf,
      crm: user.crm,
      crmUf: user.crmUf,
      vidaasActive: user.vidaasActive,
    },
  });
}
