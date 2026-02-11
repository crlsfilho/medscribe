"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PreConsultForm({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [info, setInfo] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        chiefComplaint: "",
        history: "",
        medications: "",
        allergies: "",
        surgeries: "",
        familyHistory: "",
        lifestyle: ""
    });

    useEffect(() => {
        fetchInfo();
    }, [token]);

    async function fetchInfo() {
        try {
            const res = await fetch(`/api/public/pre-consult?token=${token}`);
            if (!res.ok) throw new Error("Link invalido ou expirado");
            const data = await res.json();
            setInfo(data);

            // Pre-fill if already exists
            if (data.existingData) {
                setFormData({
                    chiefComplaint: data.existingData.chiefComplaint || "",
                    history: data.existingData.history || "",
                    medications: data.existingData.medications || "",
                    allergies: data.existingData.allergies || "",
                    surgeries: data.existingData.surgeries || "",
                    familyHistory: data.existingData.familyHistory || "",
                    lifestyle: data.existingData.lifestyle || ""
                });
            }
        } catch (error) {
            toast.error("Erro ao carregar formulario");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/public/pre-consult", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, ...formData }),
            });

            if (!res.ok) throw new Error("Erro ao salvar");

            setSuccess(true);
            toast.success("Obrigado! Suas informacoes foram enviadas.");
        } catch (error) {
            toast.error("Erro ao enviar. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!info) return <div className="p-8 text-center text-red-500">Link invalido ou expirado.</div>;

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Tudo Pronto!</h2>
                    <p className="text-gray-600">
                        Suas informações foram enviadas para o {info.doctorName || "Dr(a)."}. <br />
                        Nos vemos dia {format(new Date(info.date), "dd/MM 'às' HH:mm", { locale: ptBR })}.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white">
                    <h1 className="text-xl font-bold">Pré-Consulta</h1>
                    <p className="text-blue-100 text-sm mt-1">
                        Olá, {info.patientName}. Preencha este formulário rápido para agilizar seu atendimento com {info.doctorName}.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qual o motivo principal da consulta?</label>
                        <Textarea
                            required
                            placeholder="Ex: Dor de cabeça forte há 3 dias..."
                            className="min-h-[80px]"
                            value={formData.chiefComplaint}
                            onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quando começou e como evoluiu?</label>
                        <Textarea
                            placeholder="Conte um pouco mais sobre os sintomas..."
                            value={formData.history}
                            onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medicamentos em uso</label>
                            <Input
                                placeholder="Nome e dose (ou 'Nenhum')"
                                value={formData.medications}
                                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alergias</label>
                            <Input
                                placeholder="Medicamentos, alimentos..."
                                value={formData.allergies}
                                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cirurgias Prévias</label>
                            <Input
                                placeholder="Quais e quando..."
                                value={formData.surgeries}
                                onChange={(e) => setFormData({ ...formData, surgeries: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                            disabled={submitting}
                        >
                            {submitting ? "Enviando..." : "Enviar Informações"}
                        </Button>
                        <p className="text-center text-xs text-gray-400 mt-4">
                            Seus dados são confidenciais e enviados diretamente ao médico.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
