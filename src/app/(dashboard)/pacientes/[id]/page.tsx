"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogFooter,
} from "@/components/ui/dialog";
import { WhatsappPortalButton } from "@/components/whatsapp-portal-button";

interface Visit {
  id: string;
  audioUrl: string | null;
  transcriptText: string | null;
  soapJson: string | null;
  soapText: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Patient {
  id: string;
  name: string;
  age: number | null;
  sex: string | null;
  phoneNumber: string | null;
  shareToken: string | null;
  createdAt: string;
  visits: Visit[];
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editSex, setEditSex] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPatient = useCallback(async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      if (!response.ok) {
        throw new Error("Paciente nao encontrado");
      }
      const data = await response.json();
      setPatient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar paciente");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const handleEditOpen = () => {
    if (patient) {
      setEditName(patient.name);
      setEditAge(patient.age?.toString() || "");
      setEditSex(patient.sex || "");
      setIsEditOpen(true);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          age: editAge ? parseInt(editAge) : null,
          sex: editSex || null,
        }),
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatient((prev) =>
          prev ? { ...prev, ...updatedPatient } : prev
        );
        setIsEditOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao salvar");
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar paciente");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patient) return;

    if (
      !confirm(
        `Tem certeza que deseja apagar ${patient.name}? Todas as consultas deste paciente tambem serao apagadas.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/pacientes");
      } else {
        alert("Erro ao apagar paciente");
      }
    } catch (err) {
      console.error("Erro ao apagar:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getVisitStatus = (visit: Visit) => {
    if (visit.soapJson) {
      return { label: "Concluida", color: "bg-green-100 text-green-700" };
    }
    if (visit.transcriptText) {
      return { label: "Em andamento", color: "bg-yellow-100 text-yellow-700" };
    }
    if (visit.audioUrl) {
      return { label: "Audio gravado", color: "bg-blue-100 text-blue-700" };
    }
    return { label: "Iniciada", color: "bg-gray-100 text-gray-600" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
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
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Voltar
        </button>
        <div className="medical-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-destructive"
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
          </div>
          <h3 className="font-medium text-foreground mb-2">
            {error || "Paciente nao encontrado"}
          </h3>
          <p className="text-muted-foreground">
            Verifique se o paciente existe ou tente novamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors mt-1"
          >
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {patient.name}
              </h1>
              <p className="text-muted-foreground">
                {patient.age ? `${patient.age} anos` : "Idade nao informada"} •{" "}
                {patient.sex || "Sexo nao informado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cadastrado em {formatDateShort(patient.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:mt-0 ml-12 sm:ml-0">
          <Button variant="outline" size="sm" onClick={handleEditOpen}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeletePatient}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
            Apagar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="medical-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Consultas</p>
          <p className="text-2xl font-semibold text-foreground">
            {patient.visits.length}
          </p>
        </div>
        <div className="medical-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Concluidas</p>
          <p className="text-2xl font-semibold text-green-600">
            {patient.visits.filter((v) => v.soapJson).length}
          </p>
        </div>
        <div className="medical-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Em Andamento</p>
          <p className="text-2xl font-semibold text-yellow-600">
            {patient.visits.filter((v) => v.transcriptText && !v.soapJson).length}
          </p>
        </div>
        <div className="medical-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Ultima Consulta</p>
          <p className="text-sm font-medium text-foreground">
            {patient.visits.length > 0
              ? formatDateShort(patient.visits[0].createdAt)
              : "Nenhuma"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <WhatsappPortalButton
          patientId={patient.id}
          patientName={patient.name}
          phoneNumber={patient.phoneNumber || null} // Add to interface if not inferred
          shareToken={patient.shareToken || null} // Add to interface
        />
        <Link
          href={`/consulta/nova?patientId=${patient.id}&name=${encodeURIComponent(patient.name)}&age=${patient.age || ""}&sex=${patient.sex || ""}`}
        >
          <Button className="gap-2 rounded-xl">
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Nova Consulta
          </Button>
        </Link>
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Historico de Consultas
          </h2>
          <span className="text-sm text-muted-foreground">
            {patient.visits.length} registro{patient.visits.length !== 1 ? "s" : ""}
          </span>
        </div>

        {patient.visits.length === 0 ? (
          <div className="medical-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-muted-foreground"
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
            </div>
            <h3 className="font-medium text-foreground mb-2">
              Nenhuma consulta registrada
            </h3>
            <p className="text-muted-foreground mb-4">
              Inicie uma nova consulta para este paciente
            </p>
            <Link
              href={`/consulta/nova?patientId=${patient.id}&name=${encodeURIComponent(patient.name)}&age=${patient.age || ""}&sex=${patient.sex || ""}`}
            >
              <Button className="gap-2">
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Nova Consulta
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {patient.visits.map((visit) => {
              const status = getVisitStatus(visit);
              return (
                <Link
                  key={visit.id}
                  href={`/consulta/${visit.id}`}
                  className="medical-card p-4 hover:shadow-md transition-all block group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Consulta de {formatDate(visit.createdAt)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}
                          >
                            {status.label}
                          </span>
                          {visit.audioUrl && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                />
                              </svg>
                              Audio
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Atualizado {formatDateShort(visit.updatedAt)}
                      </span>
                      <svg
                        className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Patient Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Maria Silva"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-age">Idade</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  placeholder="Ex: 45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sex">Sexo Biologico</Label>
                <Input
                  id="edit-sex"
                  value={editSex}
                  onChange={(e) => setEditSex(e.target.value)}
                  placeholder="Ex: F ou M"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Salvando..." : "Salvar Alteracoes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
