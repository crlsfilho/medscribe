import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signatureService, SignatureProvider } from "@/lib/signature";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const authCode = searchParams.get("code"); // Standard OAuth2 authorization code
    const provider = searchParams.get("provider") as SignatureProvider;

    if (!sessionId || !authCode || !provider) {
        return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    try {
        const result = await signatureService.finalizeSignature(sessionId, authCode, provider);

        if (result.status === "signed") {
            // In a real app, we might redirect to a success page or the signed document
            return NextResponse.redirect(new URL(`/consulta?signed=${sessionId}`, request.url));
        } else {
            return NextResponse.json({ error: "Falha na assinatura" }, { status: 500 });
        }

    } catch (error) {
        console.error("Erro ao finalizar assinatura:", error);
        return NextResponse.json(
            { error: "Erro ao processar finalização de assinatura" },
            { status: 500 }
        );
    }
}
