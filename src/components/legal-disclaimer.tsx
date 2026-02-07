"use client";

import { useState } from "react";

interface LegalDisclaimerProps {
  variant?: "banner" | "modal" | "inline" | "footer";
  showDetails?: boolean;
  onAccept?: () => void;
  className?: string;
}

export function LegalDisclaimer({
  variant = "inline",
  showDetails = false,
  onAccept,
  className = "",
}: LegalDisclaimerProps) {
  const [expanded, setExpanded] = useState(showDetails);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    onAccept?.();
  };

  if (variant === "banner") {
    return (
      <div
        className={`bg-[oklch(0.95_0.03_80)] border-b border-[oklch(0.85_0.08_80)] px-4 py-3 ${className}`}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <svg
            className="w-5 h-5 text-[oklch(0.55_0.15_80)] flex-shrink-0"
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
          <p className="text-sm text-[oklch(0.40_0.10_80)]">
            <strong>Aviso:</strong> Este aplicativo utiliza inteligencia
            artificial para auxiliar na documentacao clinica. Todas as
            informacoes devem ser revisadas pelo profissional de saude.
          </p>
        </div>
      </div>
    );
  }

  if (variant === "modal") {
    if (accepted) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[oklch(0.95_0.03_80)] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[oklch(0.55_0.15_80)]"
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
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Aviso Legal Importante
              </h3>
              <p className="text-sm text-muted-foreground">
                Leia antes de continuar
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3 text-sm text-foreground/80">
            <p>
              O <strong>MedScribe</strong> e uma ferramenta de auxilio a
              documentacao clinica que utiliza inteligencia artificial.
            </p>

            <div className="p-3 rounded-xl bg-muted/50 space-y-2">
              <p className="font-medium text-foreground">
                Ao utilizar este aplicativo, voce concorda que:
              </p>
              <ul className="space-y-1.5 ml-4">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                  <span>
                    O conteudo gerado por IA e apenas uma{" "}
                    <strong>sugestao</strong> e deve ser revisado integralmente
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                  <span>
                    A <strong>responsabilidade</strong> pelas decisoes clinicas
                    e exclusivamente do profissional de saude
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                  <span>
                    Referencias cientificas sao fornecidas apenas para{" "}
                    <strong>consulta</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                  <span>
                    O aplicativo <strong>nao substitui</strong> o julgamento
                    clinico profissional
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={handleAccept}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Li e concordo com os termos
          </button>
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div
        className={`border-t border-border bg-muted/30 px-4 py-6 ${className}`}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            Compromisso com a Seguranca do Paciente
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Responsabilidade</p>
              <p>
                Todas as decisoes clinicas sao de responsabilidade exclusiva do
                profissional de saude responsavel pelo atendimento.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Revisao Obrigatoria</p>
              <p>
                O conteudo gerado por IA deve ser revisado e validado
                integralmente antes de qualquer uso clinico.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Privacidade</p>
              <p>
                Dados de pacientes sao tratados com sigilo e em conformidade com
                a LGPD e normas do CFM.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              MedScribe v1.0 - Ferramenta de auxilio a documentacao clinica
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button className="hover:text-foreground transition-colors">
                Termos de Uso
              </button>
              <button className="hover:text-foreground transition-colors">
                Politica de Privacidade
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: inline variant
  return (
    <div
      className={`rounded-xl border border-border overflow-hidden ${className}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span className="text-sm font-medium text-foreground">
            Aviso Legal e Responsabilidade
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
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
      </button>

      {expanded && (
        <div className="p-4 bg-card border-t border-border space-y-3 text-sm text-muted-foreground">
          <p>
            Este aplicativo utiliza inteligencia artificial para auxiliar na
            documentacao de consultas medicas. O conteudo gerado, incluindo
            transcricoes, notas SOAP e sugestoes de codificacao, e fornecido
            apenas como referencia.
          </p>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Pontos importantes:</p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0"></span>
                <span>
                  <strong>Nao substitui o julgamento clinico</strong> - A
                  ferramenta e um auxilio, nao uma fonte de decisao
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0"></span>
                <span>
                  <strong>Revisao obrigatoria</strong> - Todo conteudo deve ser
                  verificado pelo profissional antes do uso
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0"></span>
                <span>
                  <strong>Responsabilidade profissional</strong> - O medico e o
                  unico responsavel pelas decisoes clinicas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0"></span>
                <span>
                  <strong>Referencias cientificas</strong> - Fornecidas apenas
                  para consulta, nao como recomendacao
                </span>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 text-primary text-xs">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <span>
              Seus dados sao protegidos e tratados em conformidade com a LGPD e
              normas do CFM.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
