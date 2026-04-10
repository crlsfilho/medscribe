"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  clinicalSummary?: string | null;
  conditions?: string | null;
  createdAt: string;
  visits: Visit[];
  appointments?: { id: string, scheduledAt: string, shareToken: string | null }[];
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const galleryRef = useRef<HTMLDivElement>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editSex, setEditSex] = useState("");
  const [editPhone, setEditPhone] = useState("");
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

  const generateSummary = useCallback(async (pid: string) => {
    try {
      const res = await fetch(`/api/patients/${pid}/summary`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPatient(prev => prev ? { ...prev, clinicalSummary: data.clinicalSummary, conditions: data.conditions } : prev);
      }
    } catch (err) {
      console.error("Failed to generate summary", err);
    }
  }, []);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  useEffect(() => {
    if (patient && !patient.clinicalSummary) {
       generateSummary(patient.id);
    }
  }, [patient?.id, patient?.clinicalSummary, generateSummary]);


  const handleEditOpen = () => {
    if (patient) {
      setEditName(patient.name);
      setEditAge(patient.age?.toString() || "");
      setEditSex(patient.sex || "");
      setEditPhone(patient.phoneNumber || "");
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
          phoneNumber: editPhone || null,
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
      return { label: "Concluída", color: "bg-primary/15 text-primary" };
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
              <p className="text-sm text-muted-foreground mt-1">
                {patient.sex ? (patient.sex.toLowerCase().startsWith('f') ? 'Mulher' : 'Homem') : 'Paciente'}, {patient.age ? `${patient.age} anos` : "idade não informada"}{patient.phoneNumber ? ` • Contato: ${patient.phoneNumber}` : ""}
              </p>
              <p className="text-sm font-medium text-foreground mt-1">
                Acompanhamento desde {new Date(patient.createdAt).getFullYear()} • {patient.visits.length} Consulta{patient.visits.length !== 1 ? 's' : ''} {patient.visits.length > 0 ? `(Última em ${formatDateShort(patient.visits[0].createdAt)})` : ''}
              </p>
              {patient.conditions && patient.conditions !== "[]" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(() => {
                    try {
                      const conds = JSON.parse(patient.conditions);
                      return conds.map((c: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive uppercase tracking-wider">
                          {c}
                        </span>
                      ));
                    } catch (e) {
                      return null;
                    }
                  })()}
                </div>
              )}
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

      {/* Cards de status removidos e unificados no cabecalho */}

      {/* Clinical Summary Section */}
      <div className="space-y-3 relative group">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Resumo Clínico
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              toast.info("Lendo histórico...");
              setPatient(prev => prev ? { ...prev, clinicalSummary: null } : prev);
            }}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Atualizar IA
          </Button>
        </div>
        <div>
          {!patient.clinicalSummary ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed bg-muted/40 p-4 rounded-xl border border-muted/60">
              {patient.clinicalSummary}
            </p>
          )}
        </div>
      </div>

      {/* Management Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-y py-4 my-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Portal Access */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" onClick={() => {
              if (!patient.shareToken) return toast.error("Paciente sem token");
              const url = `${window.location.origin}/p/portal/${patient.shareToken}`;
              navigator.clipboard.writeText(url);
              toast.success("Link do portal copiado!");
            }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
              Copiar Portal
            </Button>
            <WhatsappPortalButton
              patientId={patient.id}
              patientName={patient.name}
              phoneNumber={patient.phoneNumber || null}
              shareToken={patient.shareToken || null}
            />
          </div>

          {/* Pre-Consultation */}
          {patient.appointments && patient.appointments.length > 0 ? (
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" onClick={() => {
              const token = patient.appointments![0].shareToken;
              if (!token) return toast.error("Erro no token da consulta");
              const url = `${window.location.origin}/p/form/${token}`;
              navigator.clipboard.writeText(url);
              toast.success("Pré-consulta copiada!");
            }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.101.433-.101.66 0 .79.33 1.5.86 2.016A2.25 2.25 0 0115 9c0 1.242.756 2.296 1.764 2.833M20.25 12a14.25 14.25 0 01-.285 2.199M15 21h-2.58A4.125 4.125 0 018.8 19.387l-2.071-1.282A2.75 2.75 0 015 15.753V8.818c0-.987.498-1.905 1.341-2.43 1.636-1.026 3.61-.92 5.176.223M15 21h2.25a2.25 2.25 0 002.25-2.25V13.5m0-1.096A13.882 13.882 0 0021 12m-6-1.551a3.003 3.003 0 01-3 0" /></svg>
              Copiar Pré-Consulta
            </Button>
          ) : (
            <Link href={`/consulta/nova?patientId=${patient.id}`}>
              <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Agendar
              </Button>
            </Link>
          )}
        </div>

        {/* Start Visit Shortcut (Primary) */}
        <Link
          href={`/consulta/nova?patientId=${patient.id}&name=${encodeURIComponent(patient.name)}&age=${patient.age || ""}&sex=${patient.sex || ""}`}
          className="w-full md:w-auto mt-4 md:mt-0"
        >
          <Button className="w-full md:w-auto gap-2 shadow-sm">
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
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
            Iniciar Atendimento
          </Button>
        </Link>
      </div>

      {/* Document Gallery */}
      <div className="space-y-4 border-b pb-6 md:border-b-0 md:pb-0">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 5.25v18.75A2.25 2.25 0 004.5 26.25h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-3.939a1.5 1.5 0 00-1.06.44l-2.122 2.12z" />
            </svg>
            Arquivos e Documentos
            </h2>
            <div className="hidden sm:flex gap-1">
                <button onClick={() => galleryRef.current?.scrollBy({ left: -250, behavior: 'smooth' })} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                <button onClick={() => galleryRef.current?.scrollBy({ left: 250, behavior: 'smooth' })} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
            </div>
        </div>
        
        {(() => {
          const allDocs = patient.visits.flatMap(v => 
            (v as any).actionableItems?.map((ai: any) => ({
              ...ai,
              visitDate: v.createdAt,
              metadata: JSON.parse(ai.metadata || "{}")
            })) || []
          ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          if (allDocs.length === 0) {
            return (
              <div className="medical-card p-6 border-dashed border-2 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-1">Nenhum documento</p>
                <p className="text-xs text-muted-foreground/60">Exames e receitas aparecerão aqui.</p>
              </div>
            );
          }

          return (
            <div ref={galleryRef} className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory mt-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
              {allDocs.map((doc: any) => {
                const isPatientUpload = doc.type === "exam_result";
                const docUrl = doc.metadata.url || "#";
                const filename = doc.metadata.filename || "Documento";
                
                return (
                  <div key={doc.id} className="medical-card flex-shrink-0 w-[240px] p-4 hover:border-primary/50 transition-all snap-start group bg-background relative overflow-hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg relative z-10 ${isPatientUpload ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                        {isPatientUpload ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full relative z-10 ${isPatientUpload ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isPatientUpload ? "Paciente" : "Médico"}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-sm text-foreground line-clamp-1 mb-1 relative z-10" title={filename}>
                      {filename}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mb-4 relative z-10">
                      {isPatientUpload ? "Recebido em " : "Criado em "} 
                      {formatDateShort(doc.createdAt)}
                    </p>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs h-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all relative z-10"
                      onClick={() => window.open(docUrl, '_blank')}
                    >
                      Visualizar
                    </Button>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Histórico de Consultas
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

      {/* AI AI Disclaimer */}
      <p className="text-center text-xs text-muted-foreground/50 mt-12 mb-8">
        Resumos gerados automaticamente a partir do histórico clínico. Sempre revise os dados.
      </p>

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
            <div className="space-y-2">
              <Label htmlFor="edit-phone">WhatsApp (com DDD)</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Ex: 11999998888"
              />
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
