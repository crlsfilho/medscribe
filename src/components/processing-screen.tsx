"use client";

import { useEffect, useState } from "react";

export type ProcessingStep =
  | "uploading"
  | "transcribing"
  | "generating"
  | "complete"
  | "error";

interface ProcessingScreenProps {
  currentStep: ProcessingStep;
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

const steps = [
  {
    id: "uploading",
    label: "Enviando audio",
    description: "Transferindo arquivo para processamento",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    id: "transcribing",
    label: "Transcrevendo consulta",
    description: "Convertendo audio em texto com IA",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    id: "generating",
    label: "Gerando nota SOAP",
    description: "Estruturando informacoes clinicas",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    id: "complete",
    label: "Processamento concluido",
    description: "Pronto para revisao",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
  },
];

export function ProcessingScreen({
  currentStep,
  error,
  onRetry,
  onCancel,
}: ProcessingScreenProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (currentStep === "complete" || currentStep === "error") return;

    const interval = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStepStatus = (stepId: string) => {
    const stepOrder = ["uploading", "transcribing", "generating", "complete"];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (currentStep === "error") {
      if (stepIndex < currentIndex) return "complete";
      if (stepIndex === currentIndex) return "error";
      return "pending";
    }

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="max-w-md mx-auto py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="relative inline-flex mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            {currentStep === "error" ? (
              <svg
                className="w-10 h-10 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            ) : currentStep === "complete" ? (
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            ) : (
              <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            )}
          </div>
          {currentStep !== "error" && currentStep !== "complete" && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {formatTime(elapsedTime)}
            </div>
          )}
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2">
          {currentStep === "error"
            ? "Erro no processamento"
            : currentStep === "complete"
              ? "Processamento concluido"
              : "Processando atendimento"}
        </h2>
        <p className="text-muted-foreground">
          {currentStep === "error"
            ? error || "Ocorreu um erro durante o processamento"
            : currentStep === "complete"
              ? "O atendimento foi processado com sucesso"
              : "Aguarde enquanto processamos o audio da consulta"}
        </p>
      </div>

      {/* Steps */}
      <div className="medical-card p-6 mb-6">
        <div className="space-y-1">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      status === "complete"
                        ? "bg-primary text-primary-foreground"
                        : status === "active"
                          ? "bg-primary/20 text-primary"
                          : status === "error"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {status === "complete" ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    ) : status === "active" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ) : status === "error" ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1.5">
                    <p
                      className={`font-medium ${
                        status === "active"
                          ? "text-foreground"
                          : status === "complete"
                            ? "text-foreground"
                            : status === "error"
                              ? "text-destructive"
                              : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {(status === "active" || status === "error") && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {status === "error" ? error : step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="ml-5 pl-[3px] py-1">
                    <div
                      className={`w-0.5 h-6 ${
                        getStepStatus(steps[index + 1].id) === "pending"
                          ? "bg-muted"
                          : "bg-primary"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {currentStep === "error" && (
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 h-12 rounded-xl border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {/* Privacy note */}
      <div className="flex items-center justify-center gap-2 mt-8 text-xs text-muted-foreground">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        Processamento seguro com criptografia
      </div>
    </div>
  );
}
