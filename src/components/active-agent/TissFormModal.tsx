"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionableItem, TissMetadata, TussProcedure } from "@/types/active-agent";
import { generateTissPDF } from "@/lib/pdf/tiss-generator";

interface TissFormModalProps {
  item: ActionableItem;
  metadata: TissMetadata;
  patientName: string;
  patientAge?: number | null;
  patientSex?: string | null;
  onClose: () => void;
  onComplete: () => void;
}

export function TissFormModal({
  item,
  metadata,
  patientName,
  patientAge,
  patientSex,
  onClose,
  onComplete,
}: TissFormModalProps) {
  const [procedures, setProcedures] = useState<TussProcedure[]>(
    metadata.procedureCodes || []
  );
  const [clinicalIndication, setClinicalIndication] = useState(
    metadata.clinicalIndication || ""
  );
  const [cidCode, setCidCode] = useState(metadata.cidCode || "");
  const [cidDescription, setCidDescription] = useState(
    metadata.cidDescription || ""
  );
  const [generating, setGenerating] = useState(false);

  const updateProcedureQuantity = (index: number, quantity: number) => {
    setProcedures((prev) =>
      prev.map((p, i) => (i === index ? { ...p, quantity: Math.max(1, quantity) } : p))
    );
  };

  const removeProcedure = (index: number) => {
    setProcedures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);

    try {
      const pdfBlob = generateTissPDF({
        patientName,
        patientAge: patientAge || undefined,
        patientSex: patientSex || undefined,
        procedures,
        cidCode,
        cidDescription,
        clinicalIndication,
        urgency: metadata.urgency,
        requestDate: new Date().toLocaleDateString("pt-BR"),
      });

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guia-tiss-${patientName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onComplete();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            Guia TISS - Solicitacao de Procedimentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Info */}
          <section className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-sm text-gray-700 mb-3">
              Dados do Beneficiario
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Nome:</span>
                <span className="ml-2 font-medium">{patientName}</span>
              </div>
              {patientAge && (
                <div>
                  <span className="text-gray-500">Idade:</span>
                  <span className="ml-2">{patientAge} anos</span>
                </div>
              )}
              {patientSex && (
                <div>
                  <span className="text-gray-500">Sexo:</span>
                  <span className="ml-2">
                    {patientSex === "M" ? "Masculino" : patientSex === "F" ? "Feminino" : patientSex}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Procedures */}
          <section>
            <h3 className="font-medium text-sm text-gray-700 mb-3">
              Procedimentos Solicitados
            </h3>
            <div className="space-y-2">
              {procedures.map((proc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {proc.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Codigo TUSS: {proc.code || "N/A"} | Tabela: {proc.table}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500">Qtd:</Label>
                    <Input
                      type="number"
                      min={1}
                      value={proc.quantity}
                      onChange={(e) =>
                        updateProcedureQuantity(index, parseInt(e.target.value) || 1)
                      }
                      className="w-16 h-8 text-center"
                    />
                    <button
                      onClick={() => removeProcedure(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {procedures.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum procedimento selecionado
                </p>
              )}
            </div>
          </section>

          {/* CID */}
          <section>
            <h3 className="font-medium text-sm text-gray-700 mb-3">
              Diagnostico (CID-10)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="cid-code" className="text-xs">
                  Codigo
                </Label>
                <Input
                  id="cid-code"
                  value={cidCode}
                  onChange={(e) => setCidCode(e.target.value.toUpperCase())}
                  placeholder="Ex: J00"
                  className="font-mono"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="cid-desc" className="text-xs">
                  Descricao
                </Label>
                <Input
                  id="cid-desc"
                  value={cidDescription}
                  onChange={(e) => setCidDescription(e.target.value)}
                  placeholder="Descricao do diagnostico"
                />
              </div>
            </div>
          </section>

          {/* Clinical Indication */}
          <section>
            <Label htmlFor="indication" className="text-sm font-medium text-gray-700">
              Indicacao Clinica
            </Label>
            <Textarea
              id="indication"
              value={clinicalIndication}
              onChange={(e) => setClinicalIndication(e.target.value)}
              placeholder="Descreva a indicacao clinica para os procedimentos solicitados..."
              rows={3}
              className="mt-2"
            />
          </section>

          {/* Urgency indicator */}
          <section className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Carater:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                metadata.urgency === "emergency"
                  ? "bg-red-100 text-red-700"
                  : metadata.urgency === "urgent"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {metadata.urgency === "emergency"
                ? "Emergencia"
                : metadata.urgency === "urgent"
                  ? "Urgente"
                  : "Eletivo"}
            </span>
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={generating || procedures.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Gerando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
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
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Gerar PDF
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
