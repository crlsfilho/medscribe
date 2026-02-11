"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export function WhatsappPortalButton({ patientId, patientName, phoneNumber, shareToken }: { patientId: string, patientName: string, phoneNumber: string | null, shareToken: string | null }) {
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!shareToken) {
            // Generate token if missing (should be done on backend usually, but let's assume it exists or we trigger generation)
            // For now, simpler: alert user if missing.
            toast.error("Paciente sem token de acesso.");
            return;
        }

        const portalUrl = `${window.location.origin}/p/portal/${shareToken}`;
        const message = `Olá ${patientName}, aqui é da clínica. \n\nAcesse seu Portal do Paciente para ver seus exames e receitas:\n${portalUrl}`;
        const whatsappUrl = `https://wa.me/${phoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

    if (!phoneNumber) return null;

    return (
        <Button
            variant="outline"
            className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
            onClick={handleSend}
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.68-2.031-9.67-.272-.099-.47-.149-.669-.149-.198 0-.42.001-.643.001-.223 0-.583.085-.89.421-.306.334-1.178 1.151-1.178 2.809 0 1.658 1.206 3.26 1.375 3.484.169.224 2.373 3.626 5.75 5.071.803.342 1.428.547 1.914.701.806.255 1.54.219 2.126.133.655-.096 1.758-.718 2.006-1.411.248-.693.248-1.288.173-1.413z" />
            </svg>
            Enviar Portal
        </Button>
    );
}
