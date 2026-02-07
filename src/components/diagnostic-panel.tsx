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
}

interface Hypothesis {
    name: string;
    probability: "Alta" | "Média" | "Baixa";
    reasoning: string;
    criticism: string;
    search_terms: string;
}

interface DiagnosisResponse {
    hypotheses: Hypothesis[];
    alert_flags: string[];
}

interface DiagnosticPanelProps {
    transcript?: string;
    soapContext?: any;
    className?: string;
}

export function DiagnosticPanel({ transcript, soapContext, className }: DiagnosticPanelProps) {
    const [data, setData] = useState<DiagnosisResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    // Cache for PubMed results per hypothesis
    const [evidenceCache, setEvidenceCache] = useState<Record<number, PubMedReference[]>>({});
    const [loadingEvidence, setLoadingEvidence] = useState<Record<number, boolean>>({});

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/analyze-diagnosis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript, soapContext }),
            });

            if (res.ok) {
                const json = await res.json();
                setData(json);
                setAnalyzed(true);
            }
        } catch (err) {
            console.error("Diagnosis Error", err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-analyze if there is enough content and haven't analyzed yet
    useEffect(() => {
        if (!analyzed && transcript && transcript.length > 50 && !loading) {
            // Optional: Auto-analyze or wait for user? 
            // For now, let's wait for user or maybe auto-analyze if it's the first load
            // handleAnalyze(); 
            // Keeping it manual for now to save tokens during dev, but user wanted "Proactive".
            // Let's make it auto but with a debounce or check.
        }
    }, [transcript]);

    const fetchEvidence = async (index: number, term: string) => {
        if (evidenceCache[index] || loadingEvidence[index]) return;

        setLoadingEvidence(prev => ({ ...prev, [index]: true }));
        try {
            const res = await fetch(`/api/pubmed?query=${encodeURIComponent(term)}`);
            if (res.ok) {
                const refs = await res.json();
                setEvidenceCache(prev => ({ ...prev, [index]: refs.slice(0, 3) })); // Top 3 only
            }
        } catch (err) {
            console.error("Evidence Fetch Error", err);
        } finally {
            setLoadingEvidence(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleExpand = (index: number, term: string) => {
        if (expandedIndex === index) {
            setExpandedIndex(null);
        } else {
            setExpandedIndex(index);
            fetchEvidence(index, term);
        }
    };

    const getProbColor = (prob: string) => {
        switch (prob) {
            case "Alta": return "bg-rose-100 text-rose-700 border-rose-200";
            case "Média": return "bg-orange-100 text-orange-700 border-orange-200";
            case "Baixa": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className={`flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden ${className || ""}`}>
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Hipóteses Diagnósticas</h3>
                        <p className="text-[10px] text-muted-foreground">Análise clínica baseada em IA</p>
                    </div>
                </div>

                <Button size="sm" variant={analyzed ? "outline" : "default"} onClick={handleAnalyze} disabled={loading}>
                    {loading ? "Analisando..." : analyzed ? "Re-analisar" : "Analisar Caso"}
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!analyzed && !loading && (
                    <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                        <p className="text-sm">Aguardando análise...</p>
                        <p className="text-xs">Clique em "Analisar Caso" para gerar hipóteses.</p>
                    </div>
                )}

                {data?.alert_flags && data.alert_flags.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <h4 className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase mb-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Sinais de Alerta
                        </h4>
                        <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                            {data.alert_flags.map((flag, i) => (
                                <li key={i}>{flag}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {data?.hypotheses.map((hyp, idx) => (
                        <div key={idx} className="border border-border rounded-xl overflow-hidden bg-card transition-all shadow-sm hover:shadow-md">
                            <div
                                className="p-3 flex items-start justify-between cursor-pointer hover:bg-muted/50"
                                onClick={() => handleExpand(idx, hyp.search_terms)}
                            >
                                <div>
                                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                                        {hyp.name}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getProbColor(hyp.probability)}`}>
                                            {hyp.probability}
                                        </span>
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {hyp.reasoning}
                                    </p>
                                </div>
                                <svg
                                    className={`w-4 h-4 text-muted-foreground transition-transform mt-1 ${expandedIndex === idx ? "rotate-180" : ""}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>

                            {expandedIndex === idx && (
                                <div className="px-3 pb-3 pt-0 border-t border-border/50 bg-muted/10">
                                    {/* Reasoning Details */}
                                    <div className="mt-3 text-xs space-y-2">
                                        <div>
                                            <span className="font-semibold text-muted-foreground">A favor:</span>
                                            <p className="text-foreground/90">{hyp.reasoning}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-muted-foreground">Pontos de atenção:</span>
                                            <p className="text-foreground/90">{hyp.criticism}</p>
                                        </div>
                                    </div>

                                    {/* Evidence Section */}
                                    <div className="mt-4 pt-3 border-t border-border/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Evidência Científica (PubMed)</h5>
                                            {loadingEvidence[idx] && <span className="text-[10px] animate-pulse">Buscando...</span>}
                                        </div>

                                        {evidenceCache[idx] ? (
                                            <div className="space-y-2">
                                                {evidenceCache[idx].length > 0 ? evidenceCache[idx].map(ref => (
                                                    <a
                                                        key={ref.id}
                                                        href={ref.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block p-2 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors group"
                                                    >
                                                        <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{ref.title}</p>
                                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                                            <span>{ref.journal}</span>
                                                            <span>•</span>
                                                            <span>{ref.year}</span>
                                                        </div>
                                                    </a>
                                                )) : (
                                                    <p className="text-xs text-muted-foreground italic">Nenhum artigo encontrado para "{hyp.search_terms}".</p>
                                                )}
                                                <a
                                                    href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(hyp.search_terms)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-center text-[10px] text-primary hover:underline mt-2"
                                                >
                                                    Ver mais resultados no PubMed &rarr;
                                                </a>
                                            </div>
                                        ) : (
                                            !loadingEvidence[idx] && <p className="text-xs text-muted-foreground italic">Clique para carregar evidências.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <div className="p-2 border-t border-border bg-yellow-50/50 text-[10px] text-center text-muted-foreground">
                IA de apoio. Decisão clínica é do médico.
            </div>
        </div>
    );
}
