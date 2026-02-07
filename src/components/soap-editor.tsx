"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
}

interface SOAPEditorProps {
  soap: SOAPData;
  onChange: (soap: SOAPData) => void;
  readOnly?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  badge,
  badgeColor = "bg-primary/10 text-primary",
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <span className="font-medium text-foreground">{title}</span>
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Organizado por IA
          </span>
          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
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
      </button>
      {isOpen && <div className="p-4 bg-card border-t border-border">{children}</div>}
    </div>
  );
}

export function SOAPEditor({
  soap,
  onChange,
  readOnly = false,
}: SOAPEditorProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    subjective: true,
    objective: false,
    assessment: false,
    plan: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const expandAll = () => {
    setOpenSections({
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      subjective: false,
      objective: false,
      assessment: false,
      plan: false,
    });
  };

  const updateField = (
    section: keyof SOAPData,
    field: string,
    value: string | string[]
  ) => {
    onChange({
      ...soap,
      [section]: {
        ...soap[section],
        [field]: value,
      },
    });
  };

  const updateArrayField = (
    section: keyof SOAPData,
    field: string,
    value: string
  ) => {
    const items = value.split("\n").filter((item) => item.trim());
    updateField(section, field, items);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Nota SOAP</h2>
          <p className="text-sm text-muted-foreground">
            Estrutura clinica organizada por IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Expandir tudo
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Recolher tudo
          </button>
        </div>
      </div>

      {/* AI Notice */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[oklch(0.95_0.03_80)] border border-[oklch(0.85_0.08_80)]">
        <svg
          className="w-5 h-5 text-[oklch(0.55_0.15_80)]"
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
        <span className="text-sm text-[oklch(0.40_0.10_80)]">
          <strong>Conteudo gerado por IA</strong> - Revise todas as informacoes
          antes de utilizar clinicamente
        </span>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Subjective */}
        <CollapsibleSection
          title="S - Subjetivo"
          icon={
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
                d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
          }
          isOpen={openSections.subjective}
          onToggle={() => toggleSection("subjective")}
          badge="Queixa Principal"
          badgeColor="bg-blue-100 text-blue-700"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Queixa Principal (QP)
              </Label>
              <Textarea
                value={soap.subjective.chiefComplaint}
                onChange={(e) =>
                  updateField("subjective", "chiefComplaint", e.target.value)
                }
                placeholder="Motivo principal da consulta..."
                readOnly={readOnly}
                rows={2}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Historia da Doenca Atual (HDA)
              </Label>
              <Textarea
                value={soap.subjective.historyPresentIllness}
                onChange={(e) =>
                  updateField(
                    "subjective",
                    "historyPresentIllness",
                    e.target.value
                  )
                }
                placeholder="Descricao cronologica dos sintomas, fatores de melhora/piora..."
                readOnly={readOnly}
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Objective */}
        <CollapsibleSection
          title="O - Objetivo"
          icon={
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
                d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
              />
            </svg>
          }
          isOpen={openSections.objective}
          onToggle={() => toggleSection("objective")}
          badge="Exame Fisico"
          badgeColor="bg-green-100 text-green-700"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Sinais Vitais
              </Label>
              <Textarea
                value={soap.objective.vitalSigns}
                onChange={(e) =>
                  updateField("objective", "vitalSigns", e.target.value)
                }
                placeholder="PA, FC, FR, Tax, SpO2..."
                readOnly={readOnly}
                rows={2}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Exame Fisico
              </Label>
              <Textarea
                value={soap.objective.physicalExam}
                onChange={(e) =>
                  updateField("objective", "physicalExam", e.target.value)
                }
                placeholder="Achados do exame fisico por sistemas..."
                readOnly={readOnly}
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Exames Complementares
              </Label>
              <Textarea
                value={soap.objective.labResults}
                onChange={(e) =>
                  updateField("objective", "labResults", e.target.value)
                }
                placeholder="Resultados de laboratorio, imagem..."
                readOnly={readOnly}
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Assessment */}
        <CollapsibleSection
          title="A - Avaliacao"
          icon={
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
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
              />
            </svg>
          }
          isOpen={openSections.assessment}
          onToggle={() => toggleSection("assessment")}
          badge={`${soap.assessment.diagnoses.length} diagnostico(s)`}
          badgeColor="bg-purple-100 text-purple-700"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Diagnosticos (um por linha)
              </Label>
              <Textarea
                value={soap.assessment.diagnoses.join("\n")}
                onChange={(e) =>
                  updateArrayField("assessment", "diagnoses", e.target.value)
                }
                placeholder="Hipoteses diagnosticas principais..."
                readOnly={readOnly}
                rows={4}
                className="rounded-xl resize-none"
              />
              {soap.assessment.diagnoses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {soap.assessment.diagnoses.map((diag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium"
                    >
                      {diag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-300"></span>
                Diagnosticos Diferenciais (um por linha)
              </Label>
              <Textarea
                value={soap.assessment.differentials.join("\n")}
                onChange={(e) =>
                  updateArrayField("assessment", "differentials", e.target.value)
                }
                placeholder="Outras hipoteses a considerar..."
                readOnly={readOnly}
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Plan */}
        <CollapsibleSection
          title="P - Plano"
          icon={
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
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          }
          isOpen={openSections.plan}
          onToggle={() => toggleSection("plan")}
          badge={`${soap.plan.medications.length} medicamento(s)`}
          badgeColor="bg-orange-100 text-orange-700"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                Medicamentos (um por linha)
              </Label>
              <Textarea
                value={soap.plan.medications.join("\n")}
                onChange={(e) =>
                  updateArrayField("plan", "medications", e.target.value)
                }
                placeholder="Medicamento - dose - posologia - duracao..."
                readOnly={readOnly}
                rows={4}
                className="rounded-xl resize-none"
              />
              {soap.plan.medications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {soap.plan.medications.map((med, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-medium"
                    >
                      {med}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                Procedimentos (um por linha)
              </Label>
              <Textarea
                value={soap.plan.procedures.join("\n")}
                onChange={(e) =>
                  updateArrayField("plan", "procedures", e.target.value)
                }
                placeholder="Exames solicitados, encaminhamentos..."
                readOnly={readOnly}
                rows={2}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                Orientacoes ao Paciente (uma por linha)
              </Label>
              <Textarea
                value={soap.plan.instructions.join("\n")}
                onChange={(e) =>
                  updateArrayField("plan", "instructions", e.target.value)
                }
                placeholder="Recomendacoes, sinais de alarme..."
                readOnly={readOnly}
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-300"></span>
                Retorno
              </Label>
              <Textarea
                value={soap.plan.followUp}
                onChange={(e) =>
                  updateField("plan", "followUp", e.target.value)
                }
                placeholder="Prazo e condicoes para retorno..."
                readOnly={readOnly}
                rows={2}
                className="rounded-xl resize-none"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Legal Footer */}
      <div className="flex items-start gap-2 p-4 rounded-xl bg-muted/50 border border-border">
        <svg
          className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground"
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
        <p className="text-xs text-muted-foreground">
          <strong>Aviso importante:</strong> Este documento foi gerado com
          auxilio de inteligencia artificial e deve ser revisado integralmente
          pelo profissional de saude antes do uso clinico. A responsabilidade
          pelas decisoes medicas e exclusivamente do profissional responsavel
          pelo atendimento.
        </p>
      </div>
    </div>
  );
}
