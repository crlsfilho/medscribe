import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVIDaaSService } from "@/lib/vidaas";

/**
 * POST /api/signature/sign-document
 *
 * Assina documento medico com VIDaaS (ICP-Brasil)
 *
 * FLOW:
 * 1. Medico clica em "Assinar Digitalmente"
 * 2. Frontend envia PDF base64
 * 3. Backend envia para VIDaaS API
 * 4. Medico recebe push no celular
 * 5. Autentica com biometria facial
 * 6. VIDaaS retorna PDF assinado
 * 7. Salvamos no Vercel Blob
 */

interface SignDocumentRequest {
  visitId: string;
  documentType: "prescription" | "certificate" | "exam_request" | "soap";
  documentContent: string; // Base64 PDF
  reason?: string;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const body: SignDocumentRequest = await request.json();
    const { visitId, documentType, documentContent, reason } = body;

    if (!visitId || !documentType || !documentContent) {
      return NextResponse.json(
        { error: "visitId, documentType e documentContent sao obrigatorios" },
        { status: 400 }
      );
    }

    // Get user with CPF/CRM
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        cpf: true,
        crm: true,
        crmUf: true,
        vidaasActive: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    // Check if user has VIDaaS configured
    if (!user.vidaasActive) {
      return NextResponse.json(
        {
          error: "VIDaaS nao ativo. Ative a assinatura digital nas configuracoes.",
          code: "VIDAAS_NOT_ACTIVE"
        },
        { status: 403 }
      );
    }

    if (!user.cpf || !user.crm) {
      return NextResponse.json(
        {
          error: "CPF e CRM sao necessarios para assinatura digital",
          code: "MISSING_CPF_CRM"
        },
        { status: 400 }
      );
    }

    // Verify visit belongs to user
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
      return NextResponse.json({ error: "Consulta nao encontrada" }, { status: 404 });
    }

    // Check VIDaaS provider configured
    if (!process.env.VIDAAS_API_KEY) {
      return NextResponse.json(
        {
          error: "VIDaaS nao configurado no servidor",
          code: "VIDAAS_NOT_CONFIGURED"
        },
        { status: 503 }
      );
    }

    // Request signature via VIDaaS
    const vidaas = getVIDaaSService();
    const signatureResult = await vidaas.requestSignature({
      documentContent: Buffer.from(documentContent, "base64"),
      signerCPF: user.cpf,
      signerName: user.name || "Medico",
      signerCRM: `${user.crm}/${user.crmUf}`,
      reason: reason || `${documentType} - Paciente: ${visit.patient.name}`,
      location: user.crmUf || "Brasil",
    });

    if (!signatureResult.success) {
      return NextResponse.json(
        { error: `Erro ao assinar documento: ${signatureResult.error}` },
        { status: 500 }
      );
    }

    // TODO: Upload signed PDF to Vercel Blob (uncomment when ready)
    // import { put } from "@vercel/blob";
    // const blob = await put(
    //   `signed/${visitId}-${documentType}-${Date.now()}.pdf`,
    //   signatureResult.signedDocument!,
    //   {
    //     access: 'public', // TODO: change to private with signed URLs
    //     contentType: 'application/pdf',
    //   }
    // );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        visitId,
        action: "signed_document",
        details: `Documento ${documentType} assinado digitalmente via VIDaaS`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Documento assinado com sucesso",
      // signedDocumentUrl: blob.url, // Uncomment when blob upload active
      signedDocumentBase64: signatureResult.signedDocument?.toString('base64'),
      certificateInfo: signatureResult.certificateInfo,
    });

  } catch (error) {
    console.error("Erro ao assinar documento:", error);
    return NextResponse.json(
      { error: "Erro ao processar assinatura digital" },
      { status: 500 }
    );
  }
}
