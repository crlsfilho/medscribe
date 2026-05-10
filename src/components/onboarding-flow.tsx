"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
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
import { toast } from "sonner";
import { Mic, ShieldCheck, Lock, Sparkles, ArrowRight, Check } from "lucide-react";

interface OnboardingData {
  name: string;
  cpf: string;
  crm: string;
  crmUf: string;
  specialty: string;
  phoneNumber?: string;
  clinicName?: string;
}

const STEPS = [
  { id: "name", label: "Nome", required: true },
  { id: "credentials", label: "Credenciais", required: true },
  { id: "specialty", label: "Especialização", required: true },
  { id: "extras", label: "Finalizando", required: false },
];

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const SPECIALTIES = [
  "Cardiologia",
  "Clínica Geral",
  "Dermatologia",
  "Endocrinologia",
  "Gastroenterologia",
  "Ginecologia",
  "Neurologia",
  "Ortopedia",
  "Pediatria",
  "Psiquiatria",
  "Urologia",
  "Outra",
];

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    cpf: "",
    crm: "",
    crmUf: "",
    specialty: "",
    phoneNumber: "",
    clinicName: "",
  });
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.name && !data.name) {
      setData((prev) => ({ ...prev, name: session.user.name as string }));
    }
  }, [session?.user?.name]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Name
        if (!data.name || data.name.length < 3) {
          toast.error("O nome completo é obrigatório");
          return false;
        }
        return true;

      case 1: // Credentials
        if (!data.cpf || data.cpf.replace(/\D/g, "").length !== 11) {
          toast.error("CPF inválido");
          return false;
        }
        if (!data.crm || data.crm.length < 4) {
          toast.error("CRM inválido");
          return false;
        }
        if (!data.crmUf) {
          toast.error("Selecione o estado do CRM");
          return false;
        }
        return true;

      case 2: // Specialty
        if (!data.specialty) {
          toast.error("Selecione sua especialidade");
          return false;
        }
        return true;

      case 3: // Extras (optional)
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep === STEPS.length - 1) {
      handleSubmit();
    }
  };

  const handleSkipAll = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/skip-onboarding", { method: "POST" });
      if (!response.ok) throw new Error("Erro ao pular");
      posthog.capture("onboarding_skipped", { step_at_skip: currentStep });
      toast.success("Você pode completar o cadastro depois nas Configurações!", { duration: 4500 });
      onComplete();
    } catch (err) {
      posthog.captureException(err);
      toast.error("Erro ao pular o onboarding.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar o perfil");
      }

      toast.success("Perfil completo! 🎉", {
        description: "Bem-vindo ao Steto.",
      });

      posthog.capture("onboarding_completed", {
        specialty: data.specialty,
        has_crm: !!data.crm,
        has_clinic: !!data.clinicName,
      });

      onComplete();
    } catch (error) {
      console.error("Erro:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-snug-bg p-4 relative font-sans overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-snug-sage-light rounded-full blur-[100px] opacity-60 pointer-events-none"></div>

      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-float border border-snug-sand p-8 md:p-12 z-10 relative">
        
        <Button
          onClick={handleSkipAll}
          disabled={loading}
          variant="ghost"
          className="absolute top-6 right-6 font-medium text-snug-muted hover:text-snug-text transition-colors rounded-full"
        >
          Pular
        </Button>

        {/* Header Branding */}
        <div className="flex items-center gap-2 mb-8 justify-center opacity-80">
            <div className="w-8 h-8 rounded-xl bg-snug-sage text-white flex items-center justify-center">
                <Mic className="w-4 h-4" />
            </div>
            <span className="font-serif text-2xl font-semibold tracking-tight text-snug-text">Steto</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-snug-muted uppercase tracking-wider">
              Passo {currentStep + 1} de {STEPS.length}
            </span>
            <span className="text-sm font-bold text-snug-sage">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-snug-sand rounded-full overflow-hidden">
            <div
              className="h-full bg-snug-sage transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-3 mb-10">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentStep
                  ? "bg-snug-sage scale-125 ring-4 ring-snug-sage-light"
                  : idx < currentStep
                  ? "bg-snug-sage opacity-50"
                  : "bg-snug-sand"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[280px]">
          {/* Step 0: Name */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in fade-up visible">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-snug-sage-light rounded-full flex items-center justify-center mx-auto mb-4 text-snug-sage-dark">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-serif font-medium text-snug-text mb-3">
                  Como devemos chamá-lo?
                </h2>
                <p className="text-lg text-snug-muted">
                  Vamos personalizar a sua experiência.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-bold text-snug-text">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Ex: Dr. João Silva"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  autoFocus
                  className="text-lg h-14 rounded-xl border-snug-sand bg-snug-bg/50 focus-visible:ring-snug-sage focus-visible:border-snug-sage transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 1: Credentials */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in fade-up visible">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-snug-terra/10 rounded-full flex items-center justify-center mx-auto mb-4 text-snug-terra-dark">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-serif font-medium text-snug-text mb-3">
                  Suas Credenciais
                </h2>
                <p className="text-lg text-snug-muted">
                  Essenciais para a validade dos seus documentos.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="cpf" className="text-sm font-bold text-snug-text mb-2 block">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={data.cpf}
                    onChange={(e) =>
                      setData({ ...data, cpf: formatCPF(e.target.value) })
                    }
                    maxLength={14}
                    className="text-lg h-14 rounded-xl border-snug-sand bg-snug-bg/50 focus-visible:ring-snug-sage"
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <Label htmlFor="crm" className="text-sm font-bold text-snug-text mb-2 block">CRM</Label>
                    <Input
                      id="crm"
                      placeholder="123456"
                      value={data.crm}
                      onChange={(e) =>
                        setData({ ...data, crm: e.target.value.replace(/\D/g, "") })
                      }
                      maxLength={8}
                      className="text-lg h-14 rounded-xl border-snug-sand bg-snug-bg/50 focus-visible:ring-snug-sage"
                    />
                  </div>

                  <div>
                    <Label htmlFor="crmUf" className="text-sm font-bold text-snug-text mb-2 block">UF</Label>
                    <Select
                      value={data.crmUf}
                      onValueChange={(value) =>
                        setData({ ...data, crmUf: value })
                      }
                    >
                      <SelectTrigger className="h-14 text-lg rounded-xl border-snug-sand bg-snug-bg/50 focus:ring-snug-sage font-medium">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-snug-sand shadow-card">
                        {UF_OPTIONS.map((uf) => (
                          <SelectItem key={uf} value={uf} className="font-medium cursor-pointer">
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-snug-sage-light/40 border border-snug-sage-light rounded-xl p-4 text-sm text-snug-sage-dark flex items-start gap-3 mt-4">
                <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Privacidade Absoluta:</strong> Os seus dados são armazenados e criptografados sob padrões rígidos (RGPD) e utilizados apenas para assinatura digital.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Specialty */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in fade-up visible">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                  <span className="text-3xl">🩺</span>
                </div>
                <h2 className="text-3xl font-serif font-medium text-snug-text mb-3">
                  Qual a sua especialidade?
                </h2>
                <p className="text-lg text-snug-muted">
                  Isso ajuda a IA a ajustar o vocabulário clínico.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="specialty" className="text-sm font-bold text-snug-text">Especialidade Principal</Label>
                <Select
                  value={data.specialty}
                  onValueChange={(value) => setData({ ...data, specialty: value })}
                >
                  <SelectTrigger className="h-14 text-lg rounded-xl border-snug-sand bg-snug-bg/50 focus:ring-snug-sage">
                    <SelectValue placeholder="Selecione sua especialidade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-snug-sand shadow-card">
                    {SPECIALTIES.map((spec) => (
                      <SelectItem key={spec} value={spec} className="font-medium cursor-pointer">
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Extras (Optional) */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in fade-up visible">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-snug-sage">
                  <Check className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-serif font-medium text-snug-text mb-3">
                  Tudo quase pronto.
                </h2>
                <p className="text-lg text-snug-muted">
                  Mais alguns detalhes (opcionais) para terminar.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="phone" className="text-sm font-bold text-snug-text mb-2 block">
                    Telemóvel / WhatsApp <span className="text-snug-muted font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={data.phoneNumber}
                    onChange={(e) =>
                      setData({ ...data, phoneNumber: e.target.value })
                    }
                    className="text-lg h-14 rounded-xl border-snug-sand bg-snug-bg/50 focus-visible:ring-snug-sage"
                  />
                </div>

                <div>
                  <Label htmlFor="clinic" className="text-sm font-bold text-snug-text mb-2 block">
                    Nome da Clínica <span className="text-snug-muted font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="clinic"
                    placeholder="Ex: Clínica São Lucas"
                    value={data.clinicName}
                    onChange={(e) =>
                      setData({ ...data, clinicName: e.target.value })
                    }
                     className="text-lg h-14 rounded-xl border-snug-sand bg-snug-bg/50 focus-visible:ring-snug-sage"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-12 justify-between">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="flex-shrink-0 px-6 h-14 rounded-full border-snug-sand font-bold text-snug-text hover:bg-snug-bg transition-colors"
            >
              Voltar
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 h-14 rounded-full bg-snug-sage text-white font-bold text-base hover:bg-snug-sage-dark hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 animate-spin"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Salvando...
              </span>
            ) : currentStep === STEPS.length - 1 ? (
              <>Concluir <Check className="w-5 h-5" /></>
            ) : (
              <>Continuar <ArrowRight className="w-5 h-5" /></>
            )}
          </Button>
        </div>

      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
