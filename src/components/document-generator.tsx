"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface DocumentGeneratorProps {
    soap: any;
    patientName: string;
}

type DocType = "prescription" | "exam" | "certificate" | "referral";

export function DocumentGenerator({ soap, patientName }: DocumentGeneratorProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"select" | "input" | "preview">("select");
    const [selectedType, setSelectedType] = useState<DocType>("prescription");
    const [instruction, setInstruction] = useState("");
    const [generatedDoc, setGeneratedDoc] = useState<{ title: string; content: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const docTypes = [
        { id: "prescription", label: "Receita", icon: "💊" },
        { id: "exam", label: "Exame", icon: "🔬" },
        { id: "certificate", label: "Atestado", icon: "📄" },
        { id: "referral", label: "Encaminhar", icon: "hosp" },
    ];

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/generate-document", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: selectedType,
                    instruction: instruction,
                    soap: soap,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedDoc(data);
                setStep("preview");
            }
        } catch (error) {
            console.error("Erro", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        // Mock Print - user would actually implement PDF generation here
        // For MVP we just open a window print or toast
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow?.document.write(`
        <html>
          <head><title>${generatedDoc?.title}</title></head>
          <body style="font-family: sans-serif; padding: 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h1>${generatedDoc?.title}</h1>
                <p>Paciente: ${patientName}</p>
            </div>
            <div style="white-space: pre-wrap; font-size: 14pt;">${generatedDoc?.content}</div>
            <div style="margin-top: 60px; text-align: center; border-top: 1px solid #000; width: 200px; margin-left: auto; margin-right: auto;">
                <p style="margin-top: 5px;">Assinatura do Médico</p>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
        printWindow?.document.close();
        setOpen(false);
        setStep("select");
        setInstruction("");
        setGeneratedDoc(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Gerar Doc
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Gerador de Documentos</DialogTitle>
                </DialogHeader>

                {step === "select" && (
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {docTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => { setSelectedType(type.id as DocType); setStep("input"); }}
                                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-transparent bg-muted/50 hover:bg-primary/5 hover:border-primary/50 transition-all font-medium"
                            >
                                <span className="text-2xl">{type.icon}</span>
                                {type.label}
                            </button>
                        ))}
                    </div>
                )}

                {step === "input" && (
                    <div className="py-4 space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span className="font-medium text-foreground capitalize">{selectedType}</span>
                            <span>• descreva o que precisa</span>
                        </div>
                        <Textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder={selectedType === "prescription" ? "Ex: Amoxicilina 875mg 12/12h por 7 dias" : "Descreva o pedido..."}
                            className="h-32 text-base"
                            autoFocus
                        />
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setStep("select")}>Voltar</Button>
                            <Button onClick={handleGenerate} disabled={!instruction.trim() || loading}>
                                {loading ? "Gerando..." : "Criar Documento"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === "preview" && generatedDoc && (
                    <div className="py-4 space-y-4">
                        <div className="p-4 bg-muted/20 border border-border rounded-lg max-h-[400px] overflow-y-auto">
                            <h3 className="font-bold text-center mb-4">{generatedDoc.title}</h3>
                            <Textarea
                                value={generatedDoc.content}
                                onChange={(e) => setGeneratedDoc({ ...generatedDoc, content: e.target.value })}
                                className="min-h-[200px] border-0 focus-visible:ring-0 bg-transparent resize-y"
                            />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                            Edite o texto se necessário antes de imprimir.
                        </p>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setStep("input")}>Voltar</Button>
                            <Button onClick={handlePrint} className="gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.198-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                                </svg>
                                Imprimir / PDF
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
