"use client";

import { useState } from "react";
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

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Name
        if (!data.name || data.name.length < 3) {
          toast.error("Nome completo é obrigatório");
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
        throw new Error(error.error || "Erro ao salvar perfil");
      }

      toast.success("Perfil completo! 🎉", {
        description: "Bem-vindo ao MedScribe",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Passo {currentStep + 1} de {STEPS.length}
            </span>
            <span className="text-sm font-medium text-indigo-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentStep
                  ? "bg-indigo-600 scale-125"
                  : idx < currentStep
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {/* Step 0: Name */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Olá, Doutor(a)! 👋
                </h2>
                <p className="text-gray-600">
                  Vamos começar com seu nome completo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Dr. João Silva"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  autoFocus
                  className="text-lg h-12"
                />
              </div>
            </div>
          )}

          {/* Step 1: Credentials */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Suas Credenciais 🔐
                </h2>
                <p className="text-gray-600">
                  Necessário para assinatura digital e conformidade
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={data.cpf}
                    onChange={(e) =>
                      setData({ ...data, cpf: formatCPF(e.target.value) })
                    }
                    maxLength={14}
                    className="h-12"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input
                      id="crm"
                      placeholder="123456"
                      value={data.crm}
                      onChange={(e) =>
                        setData({ ...data, crm: e.target.value.replace(/\D/g, "") })
                      }
                      maxLength={8}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="crmUf">UF</Label>
                    <Select
                      value={data.crmUf}
                      onValueChange={(value) =>
                        setData({ ...data, crmUf: value })
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="SP" />
                      </SelectTrigger>
                      <SelectContent>
                        {UF_OPTIONS.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <strong>🔒 Seguro:</strong> Seus dados são criptografados e usados
                apenas para assinatura digital ICP-Brasil.
              </div>
            </div>
          )}

          {/* Step 2: Specialty */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sua Especialidade 🩺
                </h2>
                <p className="text-gray-600">
                  Ajuda a personalizar sua experiência
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Select
                  value={data.specialty}
                  onValueChange={(value) => setData({ ...data, specialty: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione sua especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((spec) => (
                      <SelectItem key={spec} value={spec}>
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
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Quase lá! 🎯
                </h2>
                <p className="text-gray-600">
                  Informações opcionais (pode pular)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">
                    WhatsApp <span className="text-gray-400">(opcional)</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={data.phoneNumber}
                    onChange={(e) =>
                      setData({ ...data, phoneNumber: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="clinic">
                    Nome da Clínica <span className="text-gray-400">(opcional)</span>
                  </Label>
                  <Input
                    id="clinic"
                    placeholder="Clínica São Lucas"
                    value={data.clinicName}
                    onChange={(e) =>
                      setData({ ...data, clinicName: e.target.value })
                    }
                    className="h-12"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="flex-1"
            >
              Voltar
            </Button>
          )}

          {currentStep === STEPS.length - 1 && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
              className="flex-1"
            >
              Pular
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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
              "Concluir"
            ) : (
              "Continuar"
            )}
          </Button>
        </div>

        {/* Trust Signals */}
        {currentStep === 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  />
                </svg>
                <span>LGPD</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  />
                </svg>
                <span>Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  />
                </svg>
                <span>CFM</span>
              </div>
            </div>
          </div>
        )}
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
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
