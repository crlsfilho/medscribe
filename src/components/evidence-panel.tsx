"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface PubMedReference {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  pmid: string;
  url: string;
  relevance: "high" | "medium" | "low";
  snippet?: string;
}

interface EvidencePanelProps {
  diagnosis?: string;
  medications?: string[];
  onClose?: () => void;
  className?: string;
  fullHeight?: boolean;
}

export function EvidencePanel({
  diagnosis,
  medications,
  onClose,
  className,
  fullHeight = false,
}: EvidencePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diagnosis" | "medications" | "ai">("ai");

  // AI State
  const [query, setQuery] = useState("");
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string; source?: string }[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // PubMed State
  const [references, setReferences] = useState<PubMedReference[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [refQuery, setRefQuery] = useState("");

  const fetchPubMed = async (term: string) => {
    if (!term) return;
    setLoadingRefs(true);
    try {
      const res = await fetch(`/api/pubmed?query=${encodeURIComponent(term)}`);
      if (res.ok) {
        const data = await res.json();
        setReferences(data);
      }
    } catch (err) {
      console.error("PubMed Fetch Error", err);
    } finally {
      setLoadingRefs(false);
    }
  };

  useEffect(() => {
    if (diagnosis) {
      setRefQuery(diagnosis);
      fetchPubMed(diagnosis);
    }
  }, [diagnosis]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPubMed(refQuery);
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoadingAi(true);
    try {
      const res = await fetch("/api/medical-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, context: diagnosis }),
      });

      if (res.ok) {
        const data = await res.json();
        setQaHistory((prev) => [
          { q: query, a: data.answer, source: data.source },
          ...prev,
        ]);
        setQuery("");
      }
    } catch (err) {
      console.error("AI Error", err);
    } finally {
      setLoadingAi(false);
    }
  };

  const getRelevanceColor = (relevance: "high" | "medium" | "low") => {
    switch (relevance) {
      case "high":
        return "bg-[oklch(0.95_0.02_160)] text-[oklch(0.35_0.12_160)]";
      case "medium":
        return "bg-[oklch(0.95_0.03_80)] text-[oklch(0.45_0.12_80)]";
      case "low":
        return "bg-muted text-muted-foreground";
    }
  };

  const getRelevanceLabel = (relevance: "high" | "medium" | "low") => {
    switch (relevance) {
      case "high":
        return "PubMed";
      case "medium":
        return "PubMed";
      case "low":
        return "PubMed";
    }
  };


  return (
    <div className={`medical-card overflow-hidden flex flex-col ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Evidencias Cientificas
            </h3>
            <p className="text-xs text-muted-foreground">
              Referencias PubMed relacionadas
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "ai"
            ? "text-primary border-b-2 border-primary bg-primary/5"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          IA Assistant
        </button>
        <button
          onClick={() => setActiveTab("diagnosis")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "diagnosis"
            ? "text-primary border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Diagnostico
        </button>
        <button
          onClick={() => setActiveTab("medications")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "medications"
            ? "text-primary border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Remedios
        </button>
      </div>

      {/* Content */}
      <div className={`p-4 overflow-y-auto ${fullHeight ? "flex-1" : "max-h-[400px]"}`}>
        {activeTab === "ai" && (
          <div className="space-y-4">
            <form onSubmit={handleAskAI} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Posso associar Dipirona com AAS?"
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-muted/50 border border-transparent focus:bg-background focus:border-primary/20 transition-all text-sm"
                disabled={loadingAi}
              />
              <button
                type="submit"
                disabled={loadingAi || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loadingAi ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </form>

            <div className="space-y-4">
              {qaHistory.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <p>Tire duvidas de interacoes e protocolos.</p>
                  <p className="text-xs mt-1 opacity-70">Baseado em OpenFDA & Diretrizes.</p>
                </div>
              )}

              {qaHistory.map((item, idx) => (
                <div key={idx} className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">Q</span>
                    <p className="text-sm font-medium text-foreground">{item.q}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-xs font-bold">AI</span>
                    <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{item.a}</div>
                  </div>
                  {item.source && (
                    <div className="flex justify-end">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded border border-border/50">
                        Fonte: {item.source}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "diagnosis" && (
          <div className="space-y-3">
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={refQuery}
                onChange={(e) => setRefQuery(e.target.value)}
                placeholder="Buscar artigos (ex: Migraine)"
                className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-background focus:border-primary/20 text-sm"
              />
              <Button type="submit" size="sm" disabled={loadingRefs}>
                {loadingRefs ? "..." : "Buscar"}
              </Button>
            </form>

            {references.map((ref) => (
              <div
                key={ref.id}
                className="border border-border rounded-xl overflow-hidden"
              >
                {/* Header / Trigger */}
                <div
                  onClick={() =>
                    setExpandedId(expandedId === ref.id ? null : ref.id)
                  }
                  className="w-full p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setExpandedId(expandedId === ref.id ? null : ref.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                        {ref.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{ref.journal}</span>
                        <span>•</span>
                        <span>{ref.year}</span>
                        <span>•</span>
                        <span>PMID: {ref.pmid}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRelevanceColor(
                          ref.relevance
                        )}`}
                      >
                        {getRelevanceLabel(ref.relevance)}
                      </span>
                      <svg
                        className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === ref.id ? "rotate-180" : ""
                          }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === ref.id && (
                  <div className="px-4 pb-4 border-t border-border/50">
                    <div className="pt-3 space-y-3">
                      {/* Authors */}
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Autores:
                        </span>
                        <p className="text-sm text-foreground">
                          {ref.authors.join(", ")}
                        </p>
                      </div>

                      {/* Snippet */}
                      {ref.snippet && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Resumo:
                          </span>
                          <p className="text-sm text-foreground/80 italic">
                            &quot;{ref.snippet}&quot;
                          </p>
                        </div>
                      )}

                      {/* Link */}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full rounded-lg"
                      >
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                            />
                          </svg>
                          Ver no PubMed
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "medications" && (
          <div className="space-y-3">
            {medications && medications.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {medications.map((med, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                    >
                      {med}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Referencias sobre medicamentos serao exibidas aqui apos a
                  integracao com a base de dados.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum medicamento identificado ainda.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Legal Disclaimer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0 text-[oklch(0.55_0.15_80)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p>
            <strong>Aviso legal:</strong> Este painel fornece referencias
            cientificas apenas para consulta. As decisoes clinicas finais sao de
            responsabilidade exclusiva do medico.
          </p>
        </div>
      </div>
    </div>
  );
}
