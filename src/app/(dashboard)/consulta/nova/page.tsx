"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AudioRecorder } from "@/components/audio-recorder";
import {
  ProcessingScreen,
  ProcessingStep,
} from "@/components/processing-screen";
import { ConsentDialog } from "@/components/consent-dialog";

function NovaConsultaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Patient data
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState("");

  // Existing patient reference (if starting from patient profile)
  const [existingPatientId, setExistingPatientId] = useState<string | null>(null);

  // Appointment reference (if starting from scheduled appointment)
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  // Initialize from URL params (when starting from appointment or patient profile)
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    const name = searchParams.get("name");
    const age = searchParams.get("age");
    const sex = searchParams.get("sex");
    const aptId = searchParams.get("appointmentId");

    if (patientId) setExistingPatientId(patientId);
    if (name) setPatientName(name);
    if (age) setPatientAge(age);
    if (sex) setPatientSex(sex);
    if (aptId) setAppointmentId(aptId);
  }, [searchParams]);

  // Audio data
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Visit data
  const [visitId, setVisitId] = useState<string | null>(null);

  // Processing state
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(
    null
  );

  // Consent dialog state
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let patientIdToUse = existingPatientId;

      // Only create new patient if we don't have an existing one
      if (!existingPatientId) {
        const patientResponse = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: patientName,
            age: patientAge ? parseInt(patientAge) : null,
            sex: patientSex || null,
          }),
        });

        if (!patientResponse.ok) {
          const data = await patientResponse.json();
          throw new Error(data.error || "Erro ao registrar paciente");
        }

        const patient = await patientResponse.json();
        patientIdToUse = patient.id;
      }

      // Create visit
      const visitResponse = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientIdToUse,
        }),
      });

      if (!visitResponse.ok) {
        const data = await visitResponse.json();
        throw new Error(data.error || "Erro ao iniciar atendimento");
      }

      const visit = await visitResponse.json();
      setVisitId(visit.id);

      // Update appointment status if starting from scheduled appointment
      if (appointmentId) {
        try {
          await fetch(`/api/appointments/${appointmentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "completed",
              visitId: visit.id,
            }),
          });
        } catch {
          // Non-critical error, continue with the flow
          console.error("Erro ao atualizar agendamento");
        }
      }

      setShowConsentDialog(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao iniciar atendimento"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAudioReady = useCallback((blob: Blob) => {
    setAudioBlob(blob);
  }, []);

  const handleTranscribe = async () => {
    if (!audioBlob || !visitId) return;

    setLoading(true);
    setError("");
    setProcessingStep("uploading");

    try {
      // Upload audio
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("visitId", visitId);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Erro ao enviar audio");
      }

      // Transcribe
      setProcessingStep("transcribing");
      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId }),
      });

      if (!transcribeResponse.ok) {
        const data = await transcribeResponse.json();
        throw new Error(data.error || "Erro ao transcrever audio");
      }

      setProcessingStep("complete");

      // Small delay to show completion state
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push(`/consulta/${visitId}`);
    } catch (err) {
      setProcessingStep("error");
      setError(err instanceof Error ? err.message : "Erro ao processar audio");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTranscription = () => {
    if (visitId) {
      router.push(`/consulta/${visitId}`);
    }
  };

  const handleRetryProcessing = () => {
    setProcessingStep(null);
    setError("");
  };

  const handleCancelProcessing = () => {
    setProcessingStep(null);
    setLoading(false);
    setError("");
  };

  const handleConsentConfirm = () => {
    setShowConsentDialog(false);
    setStep(2);
  };

  const handleConsentCancel = () => {
    setShowConsentDialog(false);
  };

  // Show processing screen when processing
  if (processingStep) {
    return (
      <ProcessingScreen
        currentStep={processingStep}
        error={error}
        onRetry={handleRetryProcessing}
        onCancel={handleCancelProcessing}
      />
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Consent Dialog */}
      <ConsentDialog
        open={showConsentDialog}
        onConfirm={handleConsentConfirm}
        onCancel={handleConsentCancel}
        patientName={patientName}
      />

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
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
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Voltar
        </button>
        <h1 className="text-2xl font-semibold text-foreground">
          Novo Atendimento
        </h1>
        <p className="text-muted-foreground mt-1">
          {step === 1
            ? "Identificacao do paciente"
            : "Captura do audio da consulta"}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step >= 1
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {step > 1 ? (
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
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          ) : (
            "1"
          )}
        </div>
        <div
          className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`}
        ></div>
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step >= 2
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm mb-6">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="medical-card p-6">
          <form onSubmit={handlePatientSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome do paciente
              </Label>
              <Input
                id="name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nome completo"
                className="h-12 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">
                  Idade{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Ex: 45"
                  className="h-12 rounded-xl"
                  min="0"
                  max="150"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex" className="text-sm font-medium">
                  Sexo{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Select value={patientSex} onValueChange={setPatientSex}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="O">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 rounded-xl mt-6"
              disabled={loading || !patientName.trim()}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Registrando...
                </span>
              ) : (
                "Continuar"
              )}
            </Button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="medical-card">
            <AudioRecorder onAudioReady={handleAudioReady} disabled={loading} />
          </div>

          {audioBlob && (
            <div className="space-y-3">
              <Button
                onClick={handleTranscribe}
                size="lg"
                className="w-full h-12 rounded-xl"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Transcricao em andamento...
                  </span>
                ) : (
                  "Transcrever audio"
                )}
              </Button>
              <Button
                onClick={handleSkipTranscription}
                variant="ghost"
                size="lg"
                className="w-full h-12 rounded-xl"
                disabled={loading}
              >
                Prosseguir sem transcricao
              </Button>
            </div>
          )}

          {/* Info card */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/50">
            <svg
              className="w-5 h-5 text-accent-foreground mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <div className="text-sm text-accent-foreground">
              <p className="font-medium mb-1">Orientacao para gravacao</p>
              <p className="text-accent-foreground/80">
                Posicione o dispositivo proximo aos participantes e mantenha o
                ambiente silencioso para melhor qualidade de transcricao.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function NovaConsultaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NovaConsultaContent />
    </Suspense>
  );
}
