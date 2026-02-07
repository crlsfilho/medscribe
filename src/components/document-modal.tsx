"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generatePrescriptionPDF, generateExamPDF, generateCertificatePDF } from "@/lib/pdf";
import { toast } from "sonner";

interface DocumentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    soap: any;
    patient: { name: string; cpf?: string };
}

export function DocumentModal({ open, onOpenChange, soap, patient }: DocumentModalProps) {
    const [activeTab, setActiveTab] = useState("prescription");
    const [loading, setLoading] = useState(false);
    const [instruction, setInstruction] = useState("");

    // States for structured data
    const [medications, setMedications] = useState<any[]>([]);
    const [exams, setExams] = useState<string[]>([]);
    const [certificate, setCertificate] = useState<any>({ days: "1", reason: "", full_text: "" });

    const [generated, setGenerated] = useState(false);

    // --- ACTIONS ---

    const handleGenerateDraft = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/generate-document", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: activeTab,
                    soapContext: soap,
                    instruction: instruction
                })
            });

            if (!res.ok) throw new Error("Erro ao gerar rascunho");

            const { data } = await res.json();

            if (activeTab === "prescription") {
                setMedications(data.medications || []);
            } else if (activeTab === "exam") {
                setExams(data.exams || []);
            } else if (activeTab === "certificate") {
                setCertificate(data);
            }

            setGenerated(true);
        } catch (err) {
            toast.error("Falha ao gerar rascunho. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const commonData = {
            patient: { name: patient.name },
            date: new Date().toLocaleDateString("pt-BR"),
            doctorName: "Dr. Carlos Filho" // Placeholder, in real app comes from session
        };

        let blob: Blob | null = null;
        let fileName = "documento.pdf";

        if (activeTab === "prescription") {
            if (medications.length === 0) {
                toast.error("Adicione pelo menos um medicamento");
                return;
            }
            blob = generatePrescriptionPDF({
                ...commonData,
                medications: medications.map(m => ({ name: m.name, instructions: m.instructions }))
            });
            fileName = `receita-${patient.name}.pdf`;
        } else if (activeTab === "exam") {
            if (exams.length === 0) {
                toast.error("Adicione pelo menos um exame");
                return;
            }
            blob = generateExamPDF({
                ...commonData,
                exams: exams.filter(e => e.trim().length > 0)
            });
            fileName = `pedido-exames-${patient.name}.pdf`;
        } else if (activeTab === "certificate") {
            blob = generateCertificatePDF({
                ...commonData,
                days: certificate.days,
                cid: certificate.cid,
                full_text: certificate.full_text
            });
            fileName = `atestado-${patient.name}.pdf`;
        }

        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("PDF gerado com sucesso!");
            onOpenChange(false);
        }
    };

    // --- RENDER HELPERS ---

    const renderPrescriptionEditor = () => (
        <div className="space-y-4">
            {medications.map((med, idx) => (
                <div key={idx} className="flex gap-2 items-start p-2 border rounded-lg bg-card text-xs">
                    <div className="flex-1 space-y-1">
                        <Input
                            value={med.name}
                            onChange={(e) => {
                                const newMeds = [...medications];
                                newMeds[idx].name = e.target.value;
                                setMedications(newMeds);
                            }}
                            className="h-7 text-sm font-semibold border-none px-0 shadow-none focus-visible:ring-0"
                            placeholder="Nome do Medicamento"
                        />
                        <Input
                            value={med.instructions}
                            onChange={(e) => {
                                const newMeds = [...medications];
                                newMeds[idx].instructions = e.target.value;
                                setMedications(newMeds);
                            }}
                            className="h-6 text-xs text-muted-foreground border-none px-0 shadow-none focus-visible:ring-0"
                            placeholder="Posologia"
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                    >
                        ✕
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setMedications([...medications, { name: "", instructions: "" }])}>
                + Adicionar Item
            </Button>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col">
                <DialogHeader>
                    <DialogTitle>Gerador de Documentos</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setGenerated(false); }} className="flex-1">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="prescription">Receita</TabsTrigger>
                        <TabsTrigger value="exam">Exames</TabsTrigger>
                        <TabsTrigger value="certificate">Atestado</TabsTrigger>
                    </TabsList>

                    <div className="p-4 border rounded-lg bg-muted/10 min-h-[300px]">
                        {!generated ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <Label>Instrução Extra (Opcional)</Label>
                                <Input
                                    placeholder='Ex: "Adicionar Xarope para tosse"'
                                    value={instruction}
                                    onChange={(e) => setInstruction(e.target.value)}
                                />
                                <Button onClick={handleGenerateDraft} disabled={loading}>
                                    {loading ? "Gerando Rascunho..." : "Gerar Rascunho com IA"}
                                </Button>
                                <p className="text-xs text-muted-foreground text-center px-8">
                                    A IA irá analisar o diagnóstico e o plano terapêutico da consulta para preencher o documento automaticamente.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b">
                                    <h3 className="font-semibold text-sm">Editor de Rascunho</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setGenerated(false)} className="text-xs h-7">Refazer</Button>
                                </div>

                                {activeTab === "prescription" && renderPrescriptionEditor()}

                                {activeTab === "exam" && (
                                    <Textarea
                                        value={exams.join("\n")}
                                        onChange={(e) => setExams(e.target.value.split("\n"))}
                                        className="min-h-[200px]"
                                        placeholder="Lista de exames..."
                                    />
                                )}

                                {activeTab === "certificate" && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Dias de Afastamento</Label>
                                                <Input value={certificate.days} onChange={e => setCertificate({ ...certificate, days: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>CID (Opcional)</Label>
                                                <Input value={certificate.cid} onChange={e => setCertificate({ ...certificate, cid: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Texto do Atestado</Label>
                                            <Textarea
                                                value={certificate.full_text || `Atesto para os devidos fins que o paciente necessita de ${certificate.days} dias de repouso.`}
                                                onChange={e => setCertificate({ ...certificate, full_text: e.target.value })}
                                                className="h-32"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handlePrint} disabled={!generated} className="gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Imprimir PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
