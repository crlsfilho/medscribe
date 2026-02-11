"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TussSyncButton() {
    const [loading, setLoading] = useState(false);

    const handleSync = async () => {
        if (!confirm("Isso irá baixar e atualizar a tabela TUSS (Procedimentos) da ANS. Pode levar alguns segundos. Continuar?")) return;

        setLoading(true);
        try {
            const res = await fetch("/api/admin/sync-tuss", { method: "POST" });
            if (!res.ok) throw new Error("Sync failed");
            const data = await res.json();
            toast.success(`Tabela TUSS atualizada! ${data.processed} procedimentos processados.`);
        } catch (error) {
            toast.error("Erro ao atualizar TUSS.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="lg"
            className="rounded-xl"
            onClick={handleSync}
            disabled={loading}
        >
            {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Atualizando...
                </>
            ) : (
                <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Atualizar TUSS
                </>
            )}
        </Button>
    );
}
