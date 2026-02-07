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
import { ProcessingScreen, ProcessingStep } from "@/components/processing-screen";
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

  // Initialize from URL params
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

  // Audio and Visit data
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);

  // Processing state
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(null);
  const [processingError, setProcessingError] = useState<string>("");

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
        body: JSON.stringify({ patientId: patientIdToUse }),
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
            body: JSON.stringify({ status: "completed", visitId: visit.id }),
          });
        } catch {
          console.error("Erro ao atualizar agendamento");
        }
      }

      setShowConsentDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar atendimento");
    } finally {
      setLoading(false);
    }
  };

  const handleConsentConfirm = () => {
    setShowConsentDialog(false);
    setStep(2);
  };

  const handleConsentCancel = () => {
    setShowConsentDialog(false);
  };

  const handleAudioReady = useCallback((blob: Blob) => {
    setAudioBlob(blob);
  }, []);

  const handleProcessAudio = async () => {
    if (!audioBlob || !visitId) return;

    setProcessingStep("uploading");
    setProcessingError("");

    try {
      // Step 1: Upload and Transcribe
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("visitId", visitId);

      setProcessingStep("transcribing");

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const data = await transcribeResponse.json();
        throw new Error(data.error || "Erro na transcricao");
      }

      // Step 2: Generate SOAP
      setProcessingStep("generating");

      const soapResponse = await fetch("/api/generate-soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId }),
      });

      if (!soapResponse.ok) {
        const data = await soapResponse.json();
        throw new Error(data.error || "Erro ao gerar SOAP");
      }

      // Step 3: Complete
      setProcessingStep("complete");

      // Wait a moment to show success, then redirect
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push(`/consulta/${visitId}`);

    } catch (err) {
      console.error("Processing error:", err);
      setProcessingError(err instanceof Error ? err.message : "Erro no processamento");
      setProcessingStep("error");
    }
  };

  const handleRetry = () => {
    setProcessingStep(null);
    setProcessingError("");
  };

  const handleCancel = () => {
    setProcessingStep(null);
    setProcessingError("");
    setAudioBlob(null);
  };

  // Show Processing Screen
  if (processingStep) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <ProcessingScreen
          currentStep={processingStep}
          error={processingError}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      </div>
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
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            1
          </div>
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            2
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-foreground">
          {step === 1 ? "Dados do Paciente" : "Gravar Consulta"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {step === 1
            ? "Informe os dados basicos do paciente"
            : `Gravando consulta de ${patientName}`}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Step 1: Patient Form */}
      {step === 1 && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handlePatientSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome completo do paciente
              </Label>
              <Input
                id="name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Digite o nome do paciente"
                className="h-12 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Idade</Label>
                <Input
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
                <Label className="text-sm font-medium">Sexo</Label>
                <Select value={patientSex} onValueChange={setPatientSex}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
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
                <>
                  <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Registrando...
                </>
              ) : (
                <>
                  Continuar para Gravacao
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Step 2: Recording */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Patient Info Card */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {patientName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">{patientName}</p>
                <p className="text-sm text-muted-foreground">
                  {patientAge && `${patientAge} anos`}
                  {patientAge && patientSex && " • "}
                  {patientSex === "M" ? "Masculino" : patientSex === "F" ? "Feminino" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Audio Recorder Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <AudioRecorder
              onAudioReady={handleAudioReady}
              disabled={loading}
            />
          </div>

          {/* Process Button - Shows after recording */}
          {audioBlob && (
            <div className="space-y-4">
              <Button
                onClick={handleProcessAudio}
                size="lg"
                className="w-full h-14 rounded-xl text-base gap-3"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                Processar com IA
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                O audio sera transcrito e uma nota SOAP sera gerada automaticamente
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Gravacao continua
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Voce pode gravar consultas longas sem preocupacao. Use o botao de pausa
                  para interromper temporariamente se necessario.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
