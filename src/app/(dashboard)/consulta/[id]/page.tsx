"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { generateSOAPPDF, generateSOAPText } from "@/lib/pdf";
import { toast } from "sonner";

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

interface SOAPData {
  subjective: {
    chiefComplaint: string;
    historyPresentIllness: string;
    raw: string;
  };
  objective: {
    vitalSigns: string;
    physicalExam: string;
    labResults: string;
    raw: string;
  };
  assessment: {
    diagnoses: string[];
    differentials: string[];
    raw: string;
  };
  plan: {
    medications: string[];
    procedures: string[];
    instructions: string[];
    followUp: string;
    raw: string;
  };
  mentions?: {
    medications: string[];
    diagnoses: string[];
  };
}

const emptySOAP: SOAPData = {
  subjective: { chiefComplaint: "", historyPresentIllness: "", raw: "" },
  objective: { vitalSigns: "", physicalExam: "", labResults: "", raw: "" },
  assessment: { diagnoses: [], differentials: [], raw: "" },
  plan: {
    medications: [],
    procedures: [],
    instructions: [],
    followUp: "",
    raw: "",
  },
};

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
  const [soap, setSoap] = useState<SOAPData>(emptySOAP);
  const [suggestions, setSuggestions] = useState<Visit["suggestions"]>([]);

  // UI States
  const [showTranscriptionReview, setShowTranscriptionReview] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState(false);

  // Document Modal State
  const [showDocModal, setShowDocModal] = useState(false);

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
          setSoap(emptySOAP);
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

      toast.success("Consulta salva com sucesso!");
    } catch (err) {
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
    } catch {
      console.error("Erro ao aceitar sugestao");
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    try {
      await fetch(`/api/suggestions/${id}`, {
        method: "DELETE",
      });
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      console.error("Erro ao rejeitar sugestao");
    }
  };



  if (loading) return <div>Carregando...</div>;
  if (!visit) return <div>Erro ao carregar consulta</div>;

  const hasSOAP = soap.subjective.chiefComplaint || soap.assessment.diagnoses.length > 0;

  // --- COMPONENT PARTS FOR SPLIT VIEW ---

  // LEFT PANEL: Transcription & Evidence (Stacked)
  const LeftPanel = (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Top Half: Transcription */}
      <div className="flex-1 flex flex-col min-h-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-3 border-b border-border/50 bg-muted/20">
          <h2 className="font-semibold text-sm text-foreground">Transcrição</h2>
          {transcript && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {transcript.split(' ').length} palavras
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {visit.audioUrl && (
            <div className="bg-muted/30 rounded-lg p-2 border border-border/50 mb-3">
              <audio src={`/api${visit.audioUrl}`} controls className="w-full h-8" />
            </div>
          )}

          {showTranscriptionReview ? (
            <TranscriptionReview
              transcription={transcript}
              onConfirm={handleTranscriptionConfirm}
              onEdit={() => { setShowTranscriptionReview(false); setEditingTranscript(true); }}
              disabled={generating}
            />
          ) : (
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="A transcrição aparecerá aqui..."
              className="h-full min-h-[200px] bg-transparent border-0 resize-none focus-visible:ring-0 p-1 text-sm leading-relaxed"
            />
          )}
        </div>
      </div>

      {/* Bottom Half: Evidence Assist */}
      <div className="flex-1 flex flex-col min-h-0 border border-border rounded-xl shadow-sm overflow-hidden">
        <DiagnosticPanel
          transcript={transcript}
          soapContext={{
            chiefComplaint: soap.subjective.chiefComplaint,
            age: visit?.patient?.age,
            sex: visit?.patient?.sex,
            vitals: soap.objective.vitalSigns
          }}
          className="h-full border-0 rounded-none shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <DocumentModal
        open={showDocModal}
        onOpenChange={setShowDocModal}
        soap={soap}
        patient={visit.patient}
      />

      {/* Top Header Bar */}
      <header className="px-6 py-3 border-b border-border/50 bg-card/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="font-semibold text-lg">{visit.patient.name}</h1>
            <p className="text-xs text-muted-foreground">{visit.patient.sex} • {visit.patient.age} anos • {formatDate(visit.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDocModal(true)} className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Emitir Documento
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportPDF} disabled={!hasSOAP}>
            Extortar Prontuário
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
            {saving ? "Salvando..." : "Salvar Prontuário"}
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
            <SOAPEditor soap={soap} onChange={setSoap} />
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
              />
            </div>
          )}
        </div>
      </SplitLayout>
    </div>
  );
}
