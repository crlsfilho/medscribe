"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConsentDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  patientName: string;
}

export function ConsentDialog({
  open,
  onConfirm,
  onCancel,
  patientName,
}: ConsentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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
            Confirmacao de Consentimento
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            Antes de iniciar a gravacao do atendimento de{" "}
            <span className="font-medium text-foreground">{patientName}</span>,
            confirme que:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Consent items */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  O paciente foi informado sobre a gravacao
                </p>
                <p className="text-muted-foreground mt-0.5">
                  O audio sera utilizado para geracao de documentacao clinica
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-primary"
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
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Dados protegidos conforme LGPD
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Informacoes armazenadas com criptografia e acesso restrito
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Conteudo gerado por IA requer revisao
                </p>
                <p className="text-muted-foreground mt-0.5">
                  A responsabilidade clinica e do profissional de saude
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-xl"
          >
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="flex-1 rounded-xl gap-2">
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
            Confirmar e Continuar
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-center text-muted-foreground mt-2">
          Ao continuar, voce confirma estar de acordo com os termos acima
        </p>
      </DialogContent>
    </Dialog>
  );
}
