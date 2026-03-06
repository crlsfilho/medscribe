"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generatePrescriptionPDF, generateExamPDF, generateCertificatePDF } from "@/lib/pdf";
import { toast } from "sonner";
import { SignatureHelp } from "./signature-help";
import { ShieldCheck, HelpCircle, Laptop, Smartphone } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SignatureProvider } from "@/lib/signature";
import { useSession } from "next-auth/react";

interface DocumentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    soap: any;
    patient: { name: string; cpf?: string };
}

export function DocumentModal({ open, onOpenChange, soap, patient }: DocumentModalProps) {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState("prescription");
    const [loading, setLoading] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [instruction, setInstruction] = useState("");
    const [showHelp, setShowHelp] = useState(false);

    // States for structured data
    const [medications, setMedications] = useState<any[]>([]);
    const [exams, setExams] = useState<{ name: string; tuss_code?: string }[]>([]);
    const [certificate, setCertificate] = useState<any>({ days: "1", reason: "", full_text: "" });

    const [generated, setGenerated] = useState(false);

    // --- ACTIONS ---

    const getDocumentBlob = (): { blob: Blob | null, fileName: string } => {
        const commonData = {
            patient: { name: patient.name },
            date: new Date().toLocaleDateString("pt-BR"),
            doctorName: session?.user?.name || "Dr. MedScribe"
        };

        let blob: Blob | null = null;
        let fileName = "documento.pdf";

        if (activeTab === "prescription") {
            if (medications.length === 0) return { blob: null, fileName };
            blob = generatePrescriptionPDF({
                ...commonData,
                medications: medications.map(m => ({ name: m.name, instructions: m.instructions }))
            });
            fileName = `receita-${patient.name}.pdf`;
        } else if (activeTab === "exam") {
            if (exams.length === 0) return { blob: null, fileName };
            const examStrings = exams.map(e => e.tuss_code ? `${e.name} (TUSS: ${e.tuss_code})` : e.name);
            blob = generateExamPDF({
                ...commonData,
                exams: examStrings
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
        return { blob, fileName };
    };

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
                // Handle legacy string[] or new object[]
                const rawExams = data.exams || [];
                const formattedExams = rawExams.map((e: any) =>
                    typeof e === 'string' ? { name: e, tuss_code: "" } : e
                );
                setExams(formattedExams);
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
        const { blob, fileName } = getDocumentBlob();

        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("PDF gerado com sucesso!");
            onOpenChange(false);
        } else {
            toast.error("Erro ao gerar PDF. Verifique os campos.");
        }
    };

    const handleDigitalSignature = async (provider: SignatureProvider) => {
        const { blob, fileName } = getDocumentBlob();
        if (!blob) {
            toast.error("Gere o rascunho primeiro");
            return;
        }

        setIsSigning(true);
        try {
            const formData = new FormData();
            formData.append("pdf", blob, fileName);
            formData.append("provider", provider);

            const res = await fetch("/api/signature/initialize", {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Erro ao iniciar assinatura");

            const { authUrl } = await res.json();

            // Redirect to signature provider
            // In a real app, we might use a popup or redirect
            window.location.href = authUrl;
        } catch (err) {
            toast.error("Falha ao iniciar processo de assinatura.");
        } finally {
            setIsSigning(false);
        }
    };

    // --- RENDER HELPERS ---

    const renderExamEditor = () => (
        <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-xs font-medium text-muted-foreground w-2/3">Exame / Procedimento</span>
                <span className="text-xs font-medium text-muted-foreground w-1/3 pl-2">Código TUSS</span>
            </div>
            {exams.map((exam, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                    <Input
                        value={exam.name}
                        onChange={(e) => {
                            const newExams = [...exams];
                            newExams[idx].name = e.target.value;
                            setExams(newExams);
                        }}
                        className="flex-grow h-8 text-sm"
                        placeholder="Nome do Exame"
                    />
                    <Input
                        value={exam.tuss_code || ""}
                        onChange={(e) => {
                            const newExams = [...exams];
                            newExams[idx].tuss_code = e.target.value;
                            setExams(newExams);
                        }}
                        className="w-1/3 h-8 text-xs font-mono"
                        placeholder="00000000"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => setExams(exams.filter((_, i) => i !== idx))}
                    >
                        ✕
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setExams([...exams, { name: "", tuss_code: "" }])} className="w-full mt-2 border-dashed">
                + Adicionar Exame
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
                        <TabsTrigger value="exam">Exames (TISS)</TabsTrigger>
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

                                {activeTab === "prescription" && (
                                    <div className="space-y-4">
                                        {/* Simplified In-line Prescription Editor for context */}
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
                                )}

                                {activeTab === "exam" && renderExamEditor()}

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

                <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center">
                        <Dialog open={showHelp} onOpenChange={setShowHelp}>
                            <DialogTrigger asChild>
                                <Button variant="link" size="sm" className="text-muted-foreground gap-1 p-0 h-auto">
                                    <HelpCircle className="w-3 h-3" />
                                    Dúvidas sobre assinatura?
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[350px]">
                                <DialogHeader>
                                    <DialogTitle>Ajuda com Assinatura</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-[400px] overflow-y-auto">
                                    <SignatureHelp />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={!generated || isSigning} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                                    <ShieldCheck className="w-4 h-4" />
                                    {isSigning ? "Iniciando..." : "Assinar Digitalmente"}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => handleDigitalSignature("cfm_vidaas")} className="gap-2 py-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-xs">CFM (Vidaas)</span>
                                        <span className="text-[10px] text-muted-foreground">Assinar via Nuvem/Celular</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDigitalSignature("certillion")} className="gap-2 py-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Laptop className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-xs">Certificado Privado</span>
                                        <span className="text-[10px] text-muted-foreground">A1/A3 via Certillion</span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" onClick={handlePrint} disabled={!generated} className="gap-2 text-muted-foreground">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Só Imprimir (Sem Valor Jurídico)
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
