"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SignatureButtonProps {
  visitId: string;
  documentType: "prescription" | "certificate" | "exam_request" | "soap";
  documentPdfBase64: string; // PDF gerado em base64
  onSigned?: (signedPdfUrl: string) => void;
}

export function SignatureButton({
  visitId,
  documentType,
  documentPdfBase64,
  onSigned,
}: SignatureButtonProps) {
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    setSigning(true);

    try {
      const response = await fetch("/api/signature/sign-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId,
          documentType,
          documentContent: documentPdfBase64,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.code === "VIDAAS_NOT_ACTIVE") {
          toast.error("Assinatura digital não ativada", {
            description: "Ative o VIDaaS nas configurações do seu perfil.",
            action: {
              label: "Ir para Config",
              onClick: () => (window.location.href = "/settings"),
            },
          });
          return;
        }

        if (data.code === "MISSING_CPF_CRM") {
          toast.error("Dados incompletos", {
            description: "Complete seu CPF e CRM no perfil para assinar documentos.",
            action: {
              label: "Completar Dados",
              onClick: () => (window.location.href = "/settings"),
            },
          });
          return;
        }

        if (data.code === "VIDAAS_NOT_CONFIGURED") {
          toast.error("VIDaaS não configurado", {
            description: "Entre em contato com o suporte para ativar a assinatura digital.",
          });
          return;
        }

        throw new Error(data.error || "Erro ao assinar documento");
      }

      toast.success("Documento assinado!", {
        description: `Assinado por ${data.certificateInfo?.subjectCN || "você"}`,
      });

      // Download signed PDF
      if (data.signedDocumentBase64) {
        const blob = base64ToBlob(data.signedDocumentBase64, "application/pdf");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${documentType}-assinado.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }

      if (data.signedDocumentUrl) {
        onSigned?.(data.signedDocumentUrl);
      }
    } catch (error) {
      console.error("Erro ao assinar:", error);
      toast.error("Erro ao assinar documento", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setSigning(false);
    }
  };

  return (
    <Button
      onClick={handleSign}
      disabled={signing}
      variant="default"
      className="gap-2"
    >
      {signing ? (
        <>
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Assinando...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Assinar Digitalmente
        </>
      )}
    </Button>
  );
}

// Helper function
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
