"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SOAPEditor } from "@/components/soap-editor";
import { NormalizationSuggestions } from "@/components/normalization-suggestions";
import { TranscriptionReview } from "@/components/transcription-review";
import { DiagnosticPanel } from "@/components/diagnostic-panel";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { SplitLayout } from "@/components/split-layout";
import { DocumentModal } from "@/components/document-modal";
import { ActiveAgentPanel } from "@/components/active-agent";
import { ContinueRecording } from "@/components/continue-recording";
import { generateSOAPPDF, generateSOAPText } from "@/lib/pdf";
import { SOAPData, createEmptySOAP } from "@/lib/prompts";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Visit {
  id: string;
  patient: {
    name: string;
    age: number | null;
    sex: string | null;
  };
  audioUrl: string | null;
  transcriptText: string | null;
  soapJson: string | null;
  soapText: string | null;
  createdAt: string;
  updatedAt: string;
  suggestions: Array<{
    id: string;
    type: "CID" | "DCB";
    rawText: string;
    normalizedCode: string | null;
    normalizedLabel: string | null;
    confidence: number | null;
    accepted: boolean;
  }>;
}



export default function ConsultaPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params.id as string;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [transcript, setTranscript] = useState("");
  const [soap, setSoap] = useState<SOAPData>(createEmptySOAP());
  const [suggestions, setSuggestions] = useState<Visit["suggestions"]>([]);

  // UI States
  const [showTranscriptionReview, setShowTranscriptionReview] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [showContinueRecording, setShowContinueRecording] = useState(false);

  // Document Modal State
  const [showDocModal, setShowDocModal] = useState(false);

  const handleAppendTranscript = (newText: string) => {
    setTranscript(prev => prev ? `${prev}\n\n${newText}` : newText);
  };

  const handleRegenerateSOAP = async () => {
    setGenerating(true);
    try {
      // First save the updated transcript
      await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcriptText: transcript }),
      });
      // Then re-generate SOAP
      const response = await fetch("/api/generate-soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId }),
      });
      if (!response.ok) throw new Error("Erro ao re-gerar SOAP");
      const data = await response.json();
      setSoap(data.soap);
      setSuggestions(data.suggestions || []);
      posthog.capture("soap_regenerated", { visit_id: visitId });
      toast.success("Prontuário atualizado com o novo conteúdo!");
    } catch (err) {
      posthog.captureException(err);
      toast.error(err instanceof Error ? err.message : "Erro ao re-gerar SOAP");
    } finally {
      setGenerating(false);
    }
  };

  const fetchVisit = useCallback(async () => {
    try {
      const response = await fetch(`/api/visits/${visitId}`);
      if (!response.ok) {
        throw new Error("Consulta nao encontrada");
      }
      const data = await response.json();
      setVisit(data);
      setTranscript(data.transcriptText || "");
      setSuggestions(data.suggestions || []);

      if (data.soapJson) {
        try {
          setSoap(JSON.parse(data.soapJson));
          setShowTranscriptionReview(false);
        } catch {
          setSoap(createEmptySOAP());
        }
      }

      // Show transcription review if there's transcript but no SOAP yet
      if (data.transcriptText && !data.soapJson) {
        setShowTranscriptionReview(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar consulta"
      );
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    fetchVisit();
  }, [fetchVisit]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcriptText: transcript,
          soapJson: JSON.stringify(soap),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar");
      }

      posthog.capture("visit_saved", { visit_id: visitId });
      toast.success("Consulta salva com sucesso!");
    } catch (err) {
      posthog.captureException(err);
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSOAP = async () => {
    if (!transcript.trim()) {
      toast.error("Adicione uma transcricao primeiro");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/generate-soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao gerar SOAP");
      }

      const data = await response.json();
      setSoap(data.soap);
      setSuggestions(data.suggestions || []);
      setShowTranscriptionReview(false);

      toast.success("Nota SOAP gerada com sucesso!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar SOAP");
      toast.error(err instanceof Error ? err.message : "Erro ao gerar SOAP");
    } finally {
      setGenerating(false);
    }
  };

  const handleTranscriptionConfirm = (editedTranscription: string) => {
    setTranscript(editedTranscription);
    setShowTranscriptionReview(false);
    handleGenerateSOAP();
  };

  const handleExportPDF = () => {
    if (!visit) return;

    const pdfBlob = generateSOAPPDF({
      soap,
      patient: visit.patient,
      date: new Date(visit.createdAt).toLocaleDateString("pt-BR"),
    });

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nota-soap-${visit.patient.name.replace(/\s+/g, "-")}-${new Date(visit.createdAt).toISOString().split("T")[0]}.pdf`;
    a.click();
    URL.revokeObjectURL(url);

    posthog.capture("soap_exported_pdf", { visit_id: visitId });
    toast.success("PDF exportado com sucesso!");
  };

  const handleCopyToClipboard = async () => {
    if (!visit) return;

    const text = generateSOAPText({
      soap,
      patient: visit.patient,
      date: new Date(visit.createdAt).toLocaleDateString("pt-BR"),
    });

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado para a area de transferencia!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAcceptSuggestion = async (id: string) => {
    try {
      await fetch(`/api/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      });
      const suggestion = suggestions.find((s) => s.id === id);
      posthog.capture("normalization_suggestion_accepted", {
        visit_id: visitId,
        suggestion_id: id,
        suggestion_type: suggestion?.type,
        normalized_code: suggestion?.normalizedCode,
      });
    } catch {
      console.error("Erro ao aceitar sugestao");
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    try {
      await fetch(`/api/suggestions/${id}`, {
        method: "DELETE",
      });
      const suggestion = suggestions.find((s) => s.id === id);
      posthog.capture("normalization_suggestion_rejected", {
        visit_id: visitId,
        suggestion_id: id,
        suggestion_type: suggestion?.type,
      });
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      console.error("Erro ao rejeitar sugestao");
    }
  };



  if (loading) return <div>Carregando...</div>;
  if (!visit) return <div>Erro ao carregar consulta</div>;

  const hasSOAP = soap.subjective.chiefComplaint || (soap.assessment.activeProblems && soap.assessment.activeProblems.length > 0) || (soap.assessment.diagnoses && soap.assessment.diagnoses.length > 0);

  // --- COMPONENT PARTS FOR SPLIT VIEW ---

  // LEFT PANEL: Transcription & Diagnostic Panel (50/50 Split)
  const LeftPanel = (
    <div className="h-full flex flex-col gap-4 overflow-hidden pt-1">
      {/* Transcription Section (50%) */}
      <div className="flex flex-col bg-card border border-border rounded-xl shadow-sm min-h-0 flex-1">
        <div className="flex items-center gap-3 p-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h2 className="font-semibold text-sm text-foreground">Transcrição</h2>
          </div>
          {transcript && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {transcript.split(' ').length} palavras
            </span>
          )}
          <div className="ml-auto pr-8"> {/* Reserve space for collapse button */}
            {!showContinueRecording ? (
              <button
                onClick={() => setShowContinueRecording(true)}
                title="Adicionar nova sessão de gravação"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-border text-muted-foreground bg-card hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Continuar
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          {visit.audioUrl && visit.audioUrl !== "processed-in-memory" && (
            <div className="flex items-center gap-3 px-1 mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.066.925-2.066 2.067v4.866c0 1.142.925 2.067 2.066 2.067h1.934l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06Z" /></svg>
                Áudio
              </div>
              <audio
                src={visit.audioUrl.startsWith("http") ? visit.audioUrl : `/api${visit.audioUrl}`}
                controls
                className="w-full max-w-[280px] h-10 outline-none"
              />
            </div>
          )}

          {/* Continue Recording inline panel */}
          {showContinueRecording && (
            <ContinueRecording
              visitId={visitId}
              onTranscriptAppended={handleAppendTranscript}
              onRegenerate={handleRegenerateSOAP}
              onClose={() => setShowContinueRecording(false)}
            />
          )}

          {showTranscriptionReview ? (
            <TranscriptionReview
              transcription={transcript}
              onConfirm={handleTranscriptionConfirm}
              onEdit={() => { setShowTranscriptionReview(false); setEditingTranscript(true); }}
              disabled={generating}
            />
          ) : (
            <div className="relative group flex-1 flex flex-col min-h-0">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="A transcrição aparecerá aqui..."
                className="flex-1 w-full bg-transparent border-0 resize-none focus-visible:ring-0 p-0 text-sm leading-loose text-foreground/90 custom-scrollbar"
              />
              {!transcript && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hipóteses Diagnósticas Section (50%) */}
      <div className="flex-1 min-h-0 flex flex-col">
        <DiagnosticPanel
          transcript={transcript}
          soapContext={{
            chiefComplaint: soap.subjective?.chiefComplaint,
            age: visit?.patient?.age,
            sex: visit?.patient?.sex,
            vitals: soap.objective?.vitalSigns
          }}
          className="h-full"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <DocumentModal
        open={showDocModal}
        onOpenChange={setShowDocModal}
        visitId={visitId}
        soap={soap}
        patient={visit.patient}
      />

      {/* Top Header Bar */}
      <header className="px-4 sm:px-6 py-3 border-b border-border/50 bg-card/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
          <button onClick={() => router.back()} className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 hover:bg-muted shrink-0 rounded-full text-muted-foreground transition-colors">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-base sm:text-lg truncate">{visit.patient.name}</h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{visit.patient.sex} • {visit.patient.age} anos • {formatDate(visit.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                <span className="hidden sm:inline">Mais Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setShowDocModal(true); posthog.capture("document_modal_opened", { visit_id: visitId }); }}>
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Emitir Documento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} disabled={!hasSOAP}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Exportar Prontuário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2 shrink-0 h-8 sm:h-9 px-3 sm:px-4 bg-[#142d22] hover:bg-[#142d22]/90">
            {saving ? "Salvando..." : (
              <>
                <span className="hidden sm:inline">Salvar Prontuário</span>
                <span className="inline sm:hidden text-xs">Salvar</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Split Layout */}
      <SplitLayout
        leftPanel={LeftPanel}
      >
        {/* CENTER CONTENT: SOAP Editor */}
        <div className="h-full flex flex-col p-6 max-w-3xl mx-auto w-full">
          {!hasSOAP && !generating ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium">Prontuário em branco</h3>
                <p className="max-w-xs mx-auto mt-2">Revise a transcrição à esquerda e clique abaixo para gerar a nota clínica.</p>
              </div>
              <Button size="lg" onClick={handleGenerateSOAP} className="rounded-full px-8 shadow-lg shadow-primary/20">
                Gerar Nota SOAP com IA
              </Button>
            </div>
          ) : (
            <SOAPEditor 
              soap={soap} 
              onChange={setSoap}
            />
          )}

          {suggestions.length > 0 && (
            <div className="mt-8 border-t pt-8">
              <NormalizationSuggestions
                suggestions={suggestions}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
              />
            </div>
          )}

          {/* Active Agent - Sugestões de Guias TISS */}
          {hasSOAP && (
            <div className="mt-8 border-t pt-8">
              <ActiveAgentPanel
                visitId={visitId}
                patientName={visit.patient.name}
                patientAge={visit.patient.age}
                patientSex={visit.patient.sex}
                transcript={transcript}
                soapJson={JSON.stringify(soap)}
              />
            </div>
          )}
        </div>
      </SplitLayout>
    </div>
  );
}
