"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ActionableItemCard } from "./ActionableItemCard";
import { TissFormModal } from "./TissFormModal";
import { Progress } from "@/components/ui/progress";
import { ActionableItem, TissMetadata } from "@/types/active-agent";

interface ActiveAgentPanelProps {
  visitId: string;
  patientName: string;
  patientAge?: number | null;
  patientSex?: string | null;
  transcript?: string;
  soapJson?: string;
  onRefresh?: () => void;
}

export function ActiveAgentPanel({
  visitId,
  patientName,
  patientAge,
  patientSex,
  transcript,
  soapJson,
  onRefresh,
}: ActiveAgentPanelProps) {
  const [items, setItems] = useState<ActionableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated progress logic
  useEffect(() => {
    if (detecting) {
        setProgress(5);
        progressIntervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return 95;
                const increment = (95 - prev) / 15;
                return prev + Math.max(increment, 1);
            });
        }, 900);
    } else {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (progress > 0) {
            setProgress(100);
            const timer = setTimeout(() => setProgress(0), 500);
            return () => clearTimeout(timer);
        }
    }
    return () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [detecting]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ActionableItem | null>(null);
  const [showTissModal, setShowTissModal] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/active-agent/items?visitId=${visitId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  const runDetection = useCallback(async () => {
    setDetecting(true);
    // Update lastDetectedLength immediately to prevent loop
    if (transcript) setLastDetectedLength(transcript.length);
    
    try {
      const response = await fetch("/api/active-agent/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          setItems((prev) => [...data.items, ...prev]);
        }
      }
    } catch (error) {
      console.error("Erro na deteccao:", error);
    } finally {
      setDetecting(false);
    }
  }, [visitId, transcript]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Proactive detection when transcript is long and no items yet
  const [lastDetectedLength, setLastDetectedLength] = useState(0);
  useEffect(() => {
    if (transcript && transcript.length > 500 && Math.abs(transcript.length - lastDetectedLength) > 500 && !detecting && items.length === 0) {
        const timer = setTimeout(() => {
            runDetection();
        }, 5000);
        return () => clearTimeout(timer);
    }
  }, [detecting, items.length, runDetection, lastDetectedLength, transcript]);

  const handleAction = async (itemId: string, action: "accept" | "dismiss") => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (action === "accept") {
      if (item.type === "tiss_form") {
        setSelectedItem(item);
        setShowTissModal(true);
      }
    } else {
      // Dismiss
      try {
        await fetch(`/api/active-agent/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "dismissed" }),
        });
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } catch (error) {
        console.error("Erro ao dispensar item:", error);
      }
    }
  };

  const handleTissComplete = async (itemId: string) => {
    try {
      await fetch(`/api/active-agent/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setShowTissModal(false);
      setSelectedItem(null);
      onRefresh?.();
    } catch (error) {
      console.error("Erro ao completar item:", error);
    }
  };

  const pendingItems = items.filter((i) => i.status === "suggested");

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-indigo-600">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Carregando assistente...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 px-4 py-3 flex items-center gap-2 hover:bg-indigo-100/50 transition-colors"
          >
            <svg
              className="w-5 h-5 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
              />
            </svg>
            <span className="font-medium text-gray-900">Assistente IA</span>
            {pendingItems.length > 0 && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingItems.length}
              </span>
            )}
          </button>
          <button
            onClick={runDetection}
            disabled={detecting}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${detecting ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {detecting && (
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-500 italic">Analisando consulta...</span>
              <span className="text-[10px] text-gray-500 font-medium">{Math.floor(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1 bg-gray-200" />
          </div>
        )}

        {/* Content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {pendingItems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">
                  Nenhuma sugestao pendente
                </p>
                <button
                  onClick={runDetection}
                  disabled={detecting}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                >
                  {detecting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      Analisar Consulta
                    </>
                  )}
                </button>
              </div>
            ) : (
              pendingItems.map((item) => (
                <ActionableItemCard
                  key={item.id}
                  item={item}
                  onAction={(action) => handleAction(item.id, action)}
                />
              ))
            )}

            {/* Scan again button when there are items */}
            {pendingItems.length > 0 && (
              <button
                onClick={runDetection}
                disabled={detecting}
                className="w-full text-center py-2 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                {detecting ? "Analisando..." : "Analisar novamente"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* TISS Modal */}
      {showTissModal && selectedItem && selectedItem.type === "tiss_form" && (
        <TissFormModal
          item={selectedItem}
          metadata={selectedItem.metadata as TissMetadata}
          patientName={patientName}
          patientAge={patientAge}
          patientSex={patientSex}
          onClose={() => {
            setShowTissModal(false);
            setSelectedItem(null);
          }}
          onComplete={() => handleTissComplete(selectedItem.id)}
        />
      )}
    </>
  );
}
