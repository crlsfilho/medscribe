import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signatureService, SignatureProvider } from "@/lib/signature";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const pdfFile = formData.get("pdf") as File;
        const provider = formData.get("provider") as SignatureProvider;

        if (!pdfFile || !provider) {
            return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
        }

        // Initialize session with the provider
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfBlob = new Blob([arrayBuffer], { type: "application/pdf" });

        const sigSession = await signatureService.initializeSession(
            pdfBlob,
            provider,
            {
                name: session.user.name || "Médico",
                email: session.user.email || "",
            }
        );

        return NextResponse.json({
            sessionId: sigSession.sessionId,
            authUrl: sigSession.authUrl
        });

    } catch (error) {
        console.error("Erro ao inicializar assinatura:", error);
        return NextResponse.json(
            { error: "Erro ao processar solicitação de assinatura" },
            { status: 500 }
        );
    }
}
