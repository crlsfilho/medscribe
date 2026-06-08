import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, phoneDigits } = body;

    if (!token || !phoneDigits) {
      return NextResponse.json(
        { error: "Token e dígitos do telefone são obrigatórios" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { shareToken: token },
      select: { id: true, phoneNumber: true }
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Acesso inválido" },
        { status: 404 }
      );
    }

    // Limpa caracteres não numéricos do telefone
    const cleanPhone = (patient.phoneNumber || "").replace(/\D/g, "");
    const lastFour = cleanPhone.slice(-4);

    if (lastFour !== phoneDigits) {
      return NextResponse.json(
        { error: "Os 4 dígitos informados não coincidem com o celular cadastrado." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true, verified: true });
    
    // Cookie de sessão seguro do portal válido por 1 hora
    response.cookies.set(`portal_verified_${token}`, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // 1 hora
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Erro na verificação do portal:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
