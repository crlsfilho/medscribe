"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SOAPData, ActiveProblem, MedicationAction } from "@/lib/prompts";

interface SOAPEditorProps {
  soap: SOAPData;
  onChange: (soap: SOAPData) => void;
  readOnly?: boolean;
  assessmentPanel?: React.ReactNode;
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
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-card hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2">
          <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <span className="font-medium text-sm sm:text-base text-foreground truncate">{title}</span>
          {badge && (
            <span
              className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium shrink-0 ${badgeColor}`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
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
      {/* Show badge on mobile below title if open, or omit. For simplicity, just hidden on very small. */}
      {isOpen && (
        <div className="p-3 sm:p-4 bg-card border-t border-border flex flex-col gap-4">
          {badge && (
            <div className="sm:hidden mb-2">
              <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-medium ${badgeColor}`}>
                {badge}
              </span>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

export function SOAPEditor({
  soap,
  onChange,
  readOnly = false,
  assessmentPanel,
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
        ...(soap[section] as any),
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

  const updateArrayOfObjectsField = (
    section: keyof SOAPData,
    field: string,
    value: any[]
  ) => {
    onChange({
      ...soap,
      [section]: {
        ...(soap[section] as any),
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Nota Estruturada
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium" title="Gerado e estruturado por Inteligência Artificial">
              IA Assistida
            </span>
          </h2>
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
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                História Mórbida Pregressa (HMP)
              </Label>
              <Textarea
                value={soap.subjective.pastMedicalHistory || ""}
                onChange={(e) => updateField("subjective", "pastMedicalHistory", e.target.value)}
                placeholder="Doenças prévias, cirurgias, alergias..."
                readOnly={readOnly} rows={3} className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                História Familiar (HMF)
              </Label>
              <Textarea
                value={soap.subjective.familyHistory || ""}
                onChange={(e) => updateField("subjective", "familyHistory", e.target.value)}
                placeholder="Doenças na família..."
                readOnly={readOnly} rows={2} className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                História Social
              </Label>
              <Textarea
                value={soap.subjective.socialHistory || ""}
                onChange={(e) => updateField("subjective", "socialHistory", e.target.value)}
                placeholder="Tabagismo, etilismo, ocupação..."
                readOnly={readOnly} rows={2} className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                Revisão por Sistemas
              </Label>
              <Textarea
                value={soap.subjective.reviewOfSystems || ""}
                onChange={(e) => updateField("subjective", "reviewOfSystems", e.target.value)}
                placeholder="Outros sintomas relatados/negados fora da HMA..."
                readOnly={readOnly} rows={3} className="rounded-xl resize-none"
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
          badge={`${soap.assessment.activeProblems?.length || 0} problema(s)`}
          badgeColor="bg-purple-100 text-purple-700"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Diagnósticos da Consulta (um por linha)
              </Label>
              <Textarea
                value={soap.assessment.encounterDiagnoses?.join("\n") || ""}
                onChange={(e) =>
                  updateArrayField("assessment", "encounterDiagnoses", e.target.value)
                }
                placeholder="Diagnósticos pontuais identificados hoje..."
                readOnly={readOnly}
                rows={3}
                className="rounded-xl resize-none"
              />
              {soap.assessment.encounterDiagnoses?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {soap.assessment.encounterDiagnoses.map((diag, idx) => {
                    return (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium"
                      >
                        {diag}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Problemas Ativos (Tag [Ativo/Controlado/Resolvido] + Problema)
              </Label>
              <Textarea
                value={(soap.assessment.activeProblems || []).map(p => `[${p.status || "ativo"}] ${p.name}`).join("\n")}
                onChange={(e) => {
                   const lines = e.target.value.split('\n').filter(l => l.trim());
                   const parsed = lines.map(l => {
                      const match = l.match(/^\[(.*?)\] (.*)/);
                      if (match) return { status: match[1].toLowerCase(), name: match[2] };
                      return { status: "ativo", name: l };
                   });
                   updateArrayOfObjectsField("assessment", "activeProblems", parsed);
                }}
                placeholder="[controlado] Hipertensão..."
                readOnly={readOnly} rows={3} className="rounded-xl resize-none"
              />
            </div>

            {soap.assessment.diagnoses && soap.assessment.diagnoses.length > 0 && (
              <div className="space-y-2 opacity-60">
                 <Label className="text-xs font-medium">Diagnósticos Legados (Prontuário Antigo)</Label>
                 <Textarea value={(soap.assessment.diagnoses || []).join('\n')} readOnly rows={2} className="rounded-xl text-xs" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                Raciocínio Clínico
              </Label>
              <Textarea
                value={soap.assessment.clinicalReasoning || ""}
                onChange={(e) => updateField("assessment", "clinicalReasoning", e.target.value)}
                placeholder="Explicite o cruzamento sintoma-exame..."
                readOnly={readOnly} rows={3} className="rounded-xl resize-none"
              />
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
            {/* Inject AI Diagnostic Panel Here */}
            {assessmentPanel && (
              <div className="mt-6 pt-6 border-t border-border border-dashed">
                {assessmentPanel}
              </div>
            )}
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
                Metas Terapêuticas
              </Label>
              <Textarea
                value={soap.plan.therapeuticGoals || ""}
                onChange={(e) => updateField("plan", "therapeuticGoals", e.target.value)}
                placeholder="Metas fisiológicas exatas para a próxima consulta..."
                readOnly={readOnly} rows={2} className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                Medicamentos (Tag [Iniciar/Manter/Ajustar/Suspender] + Nome)
              </Label>
              <Textarea
                value={
                   soap.plan.medications?.length > 0 && typeof soap.plan.medications[0] === "string" 
                   ? (soap.plan.medications as string[]).join("\n")
                   : (soap.plan.medications as MedicationAction[])?.map(m => `[${(m.action || "MANTER").toUpperCase()}] ${m.name}`).join("\n") || ""
                }
                onChange={(e) => {
                   const lines = e.target.value.split('\n').filter(l => l.trim());
                   const parsed = lines.map(l => {
                      const match = l.match(/^\[(.*?)\] (.*)/);
                      if (match) return { action: match[1].toLowerCase(), name: match[2] };
                      return { action: "manter", name: l };
                   });
                   updateArrayOfObjectsField("plan", "medications", parsed);
                }}
                placeholder="[INICIAR] Dipirona 500mg..."
                readOnly={readOnly}
                rows={4}
                className="rounded-xl resize-none"
              />
              {soap.plan.medications && soap.plan.medications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {soap.plan.medications.map((med: string | MedicationAction, idx) => {
                    if (typeof med === "string") {
                       return <span key={idx} className="px-2 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-medium">{med.split(' ')[0]}</span>;
                    }
                    return (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                           med.action === 'iniciar' ? 'bg-green-100 text-green-700' :
                           med.action === 'suspender' ? 'bg-red-100 text-red-700' :
                           med.action === 'ajustar' ? 'bg-blue-100 text-blue-700' :
                           'bg-orange-50 text-orange-700'
                        }`}
                      >
                        <span className="opacity-60 text-[10px] uppercase font-bold">{med.action}</span>
                        {med.name}
                      </span>
                    )
                  })}
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
