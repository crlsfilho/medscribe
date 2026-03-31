"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generatePrescriptionPDF, generateExamPDF, generateCertificatePDF, generateDiagnosticPDF } from "@/lib/pdf";
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
    const [diagnoses, setDiagnoses] = useState<string[]>([]);

    const [generated, setGenerated] = useState(false);

    // Auto-populate from SOAP if possible so user can export immediately
    useEffect(() => {
        if (open && soap) {
            let hasData = false;
            if (soap.plan?.medications?.length > 0) {
                setMedications(soap.plan.medications.map((m: string) => ({ name: m, instructions: "Uso conforme orientação clínica" })));
                hasData = true;
            } else {
                setMedications([]);
            }
            if (soap.plan?.procedures?.length > 0 || soap.objective?.labResults?.length > 0) {
                const procedures = soap.plan.procedures || [];
                setExams(procedures.map((p: string) => ({ name: p, tuss_code: "" })));
                hasData = true;
            } else {
                setExams([]);
            }
            if (soap.assessment?.diagnoses?.length > 0) {
                setDiagnoses(soap.assessment.diagnoses);
                hasData = true;
            } else {
                setDiagnoses([]);
            }
            
            if (hasData) {
                setGenerated(true);
            } else {
                setGenerated(false);
            }
        }
    }, [open, soap]);

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
        } else if (activeTab === "diagnoses") {
            if (diagnoses.length === 0) return { blob: null, fileName };
            blob = generateDiagnosticPDF({
                ...commonData,
                diagnoses: diagnoses
            });
            fileName = `hipoteses-diagnosticas-${patient.name}.pdf`;
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
            } else if (activeTab === "diagnoses") {
                setDiagnoses(data.diagnoses || []);
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

    // --- RENDER HELPERS ---
    
    const getTabContent = () => {
        switch (activeTab) {
            case "exam":
                return {
                    placeholder: 'Ex: "Solicitar Hemograma Completo urgentemente"',
                    btnText: loading ? "Analisando Prontuário..." : "Gerar Pedido de Exames",
                    description: "A IA estruturará os exames necessários com base no diagnóstico e plano do paciente."
                };
            case "diagnoses":
                return {
                    placeholder: 'Ex: "Gerar relatório de hipóteses diagnósticas com base na avaliação"',
                    btnText: loading ? "Gerando Relatório..." : "Gerar Hipóteses",
                    description: "A IA listará os diagnósticos e possíveis diagnósticos diferenciais."
                };
            case "certificate":
                return {
                    placeholder: 'Ex: "Atestado de 3 dias por Sindrome Gripal"',
                    btnText: loading ? "Formulando Atestado..." : "Gerar Atestado",
                    description: "A IA formulará o atestado com o repouso repassado no prontuário."
                };
            default: // prescription
                return {
                    placeholder: 'Ex: "Adicionar xarope para tosse"',
                    btnText: loading ? "Montando Receita..." : "Gerar Receita",
                    description: "A IA preencherá as medicações exatas com suas posologias."
                };
        }
    };
    const tabData = getTabContent();

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
                        className="flex-grow h-8 text-sm border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 bg-muted/30"
                        placeholder="Nome do Exame"
                    />
                    <Input
                        value={exam.tuss_code || ""}
                        onChange={(e) => {
                            const newExams = [...exams];
                            newExams[idx].tuss_code = e.target.value;
                            setExams(newExams);
                        }}
                        className="w-1/3 h-8 text-xs font-mono border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 bg-muted/30"
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
            <Button variant="outline" size="sm" onClick={() => setExams([...exams, { name: "", tuss_code: "" }])} className="w-full mt-2 border-dashed rounded-xl h-10 text-muted-foreground hover:text-foreground">
                + Adicionar Exame Manualmente
            </Button>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-xl max-h-[85vh] overflow-y-auto flex flex-col rounded-[24px] p-5 sm:p-7 border-border shadow-2xl">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
                    <DialogTitle className="text-xl font-bold">Exportar Documento</DialogTitle>
                    {/* Compact Help Button Next to Title */}
                    <Dialog open={showHelp} onOpenChange={setShowHelp}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full transition-colors">
                                <HelpCircle className="w-5 h-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm rounded-[24px]">
                            <DialogHeader>
                                <DialogTitle>Como assinar?</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[400px] overflow-y-auto rounded-xl">
                                <SignatureHelp />
                            </div>
                        </DialogContent>
                    </Dialog>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setGenerated(false); }} className="flex-1 mt-4">
                    <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50 p-1.5 rounded-2xl h-auto">
                        <TabsTrigger value="prescription" className="rounded-xl py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium transition-all text-xs sm:text-sm">Receita</TabsTrigger>
                        <TabsTrigger value="exam" className="rounded-xl py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium transition-all text-xs sm:text-sm">Exames</TabsTrigger>
                        <TabsTrigger value="certificate" className="rounded-xl py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium transition-all text-xs sm:text-sm">Atestado</TabsTrigger>
                        <TabsTrigger value="diagnoses" className="rounded-xl py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium transition-all text-xs sm:text-sm">Hipóteses</TabsTrigger>
                    </TabsList>

                    <div className="p-6 border-2 border-dashed border-border/60 rounded-[20px] bg-card/50 min-h-[320px] mb-2 transition-all">
                        {!generated ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-6 pt-8 pb-4">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2 shadow-inner">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                                    </svg>
                                </div>
                                <div className="w-full max-w-sm space-y-3">
                                    <Input
                                        placeholder={tabData.placeholder}
                                        value={instruction}
                                        onChange={(e) => setInstruction(e.target.value)}
                                        className="h-12 rounded-xl text-center bg-muted/40 border-transparent focus-visible:bg-background shadow-none transition-colors"
                                    />
                                    <Button 
                                        onClick={handleGenerateDraft} 
                                        disabled={loading} 
                                        className="w-full h-12 rounded-xl gap-2 font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                        variant="default"
                                    >
                                        {tabData.btnText}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground text-center max-w-sm px-4">
                                    {tabData.description}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Rascunho Gerado</h3>
                                    <Button variant="outline" size="sm" onClick={() => setGenerated(false)} className="text-xs h-8 rounded-lg gap-2">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                        Refazer
                                    </Button>
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
                                                        className="h-8 text-sm font-semibold border-none px-2 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-md"
                                                        placeholder="Nome do Medicamento"
                                                    />
                                                    <Input
                                                        value={med.instructions}
                                                        onChange={(e) => {
                                                            const newMeds = [...medications];
                                                            newMeds[idx].instructions = e.target.value;
                                                            setMedications(newMeds);
                                                        }}
                                                        className="h-7 text-xs text-muted-foreground border-none px-2 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-md"
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
                                                value={certificate.full_text || `Atesto para os devidos fins a necessidade de repouso por ${certificate.days || 1} dias.`}
                                                onChange={e => setCertificate({ ...certificate, full_text: e.target.value })}
                                                className="h-32"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "diagnoses" && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center pb-2 border-b border-border/50">
                                            <span className="text-xs font-medium text-muted-foreground w-full">Diagnóstico / Hipótese</span>
                                        </div>
                                        {diagnoses.map((diag, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <Input
                                                    value={diag}
                                                    onChange={(e) => {
                                                        const newDiags = [...diagnoses];
                                                        newDiags[idx] = e.target.value;
                                                        setDiagnoses(newDiags);
                                                    }}
                                                    className="flex-grow h-8 text-sm border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 bg-muted/30"
                                                    placeholder="Diagnóstico"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                                    onClick={() => setDiagnoses(diagnoses.filter((_, i) => i !== idx))}
                                                >
                                                    ✕
                                                </Button>
                                            </div>
                                        ))}
                                        <Button variant="outline" size="sm" onClick={() => setDiagnoses([...diagnoses, ""])} className="w-full mt-2 border-dashed rounded-xl h-10 text-muted-foreground hover:text-foreground">
                                            + Adicionar Hipótese Manualmente
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Tabs>

                <DialogFooter className="mt-6 flex flex-col sm:flex-row-reverse sm:items-center gap-3 w-full border-t border-border/40 pt-5">
                    {/* Primary Export / Sign Button */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                disabled={!generated || isSigning} 
                                className="w-full sm:w-auto h-14 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg hover:shadow-xl sm:px-8 font-bold text-base transition-all hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                {isSigning ? "Iniciando..." : tabData.btnText.includes("Receita") ? "Assinar Receita" : "Assinar Digitalmente"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[280px] rounded-xl p-2 shadow-xl border-border/60">
                            <DropdownMenuItem onClick={() => handleDigitalSignature("cfm_vidaas")} className="gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">CFM (Vidaas)</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">Assinatura Gratuita em Nuvem</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1"/>
                            <DropdownMenuItem onClick={() => handleDigitalSignature("certillion")} className="gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <Laptop className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">Certificado Digital via Nuvem</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">e-CPF A3 Token Prévio</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Secondary Ghost Button */}
                    <Button 
                        variant="ghost" 
                        onClick={handlePrint} 
                        disabled={!generated} 
                        className="w-full sm:w-auto h-12 gap-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl font-medium transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Exportar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
