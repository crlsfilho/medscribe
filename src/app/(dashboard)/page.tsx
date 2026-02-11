"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/calendar";
import { MedicalNews } from "@/components/medical-news";
import { TussSyncButton } from "@/components/tuss-sync-button";

interface Visit {
  id: string;
  patient: {
    name: string;
    age: number | null;
    sex: string | null;
  };
  transcriptText: string | null;
  soapJson: string | null;
  createdAt: string;
  updatedAt: string;
}

type VisitStatus = "pending" | "transcribed" | "soap_generated" | "reviewed";

function getVisitStatus(visit: Visit): VisitStatus {
  if (visit.soapJson) return "soap_generated";
  if (visit.transcriptText) return "transcribed";
  return "pending";
}

function getStatusLabel(status: VisitStatus): string {
  switch (status) {
    case "pending":
      return "Pendente";
    case "transcribed":
      return "Transcrito";
    case "soap_generated":
      return "SOAP gerado";
    case "reviewed":
      return "Revisado";
  }
}

function getStatusColor(status: VisitStatus): string {
  switch (status) {
    case "pending":
      return "bg-muted-foreground";
    case "transcribed":
      return "bg-[oklch(0.55_0.15_160)]";
    case "soap_generated":
      return "bg-primary";
    case "reviewed":
      return "bg-[oklch(0.50_0.12_200)]";
  }
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const response = await fetch("/api/visits");
      if (response.ok) {
        const data = await response.json();
        setVisits(data);
      }
    } catch (error) {
      console.error("Erro ao carregar consultas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisit = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();

    if (!confirm("Tem certeza que deseja apagar esta consulta?")) {
      return;
    }

    try {
      const response = await fetch(`/api/visits/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVisits(visits.filter((v) => v.id !== id));
      } else {
        alert("Erro ao apagar consulta");
      }
    } catch (error) {
      console.error("Erro deletando:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    }

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getUserTitle = () => {
    const name = session?.user?.name;
    if (!name) return "Dr.";

    const firstName = name.split(" ")[0];
    // Simple heuristic: names ending in 'a' are often feminine in Portuguese
    const isFeminine = firstName.toLowerCase().endsWith("a");
    return isFeminine ? `Dra. ${firstName}` : `Dr. ${firstName}`;
  };

  const todayVisits = visits.filter((v) => {
    const visitDate = new Date(v.createdAt);
    const today = new Date();
    return visitDate.toDateString() === today.toDateString();
  });

  const pendingReview = visits.filter(
    (v) => v.transcriptText && !v.soapJson
  ).length;

  const monthVisits = visits.filter((v) => {
    const visitDate = new Date(v.createdAt);
    const today = new Date();
    return (
      visitDate.getMonth() === today.getMonth() &&
      visitDate.getFullYear() === today.getFullYear()
    );
  });

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {getGreeting()}, {getUserTitle()}
          </h1>
          <div className="space-y-4 mt-2">
            <p className="text-muted-foreground">
              {todayVisits.length === 0
                ? "Seu dia esta livre para novos atendimentos"
                : `${todayVisits.length} ${todayVisits.length === 1 ? "atendimento registrado" : "atendimentos registrados"} hoje`}
              <span className="text-muted-foreground/30 mx-2">•</span>
              <span className="text-sm font-medium text-foreground/80">Total: {monthVisits.length} consultas/mês</span>
            </p>
            <MedicalNews />
          </div>
        </div>
        <div className="flex gap-2">
          <TussSyncButton />
          <Link href="/consulta/nova">
            <Button size="lg" className="tap-target gap-2 rounded-xl shadow-sm">
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
              Novo Atendimento
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Review Alert */}
      {pendingReview > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[oklch(0.95_0.03_80)] border border-[oklch(0.85_0.08_80)]">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.90_0.05_80)] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[oklch(0.50_0.15_80)]"
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
          <div className="flex-1">
            <p className="font-medium text-[oklch(0.35_0.10_80)]">
              {pendingReview}{" "}
              {pendingReview === 1
                ? "atendimento aguarda"
                : "atendimentos aguardam"}{" "}
              geracao de nota SOAP
            </p>
            <p className="text-sm text-[oklch(0.45_0.08_80)]">
              Revise as transcricoes e gere a documentacao clinica
            </p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <Calendar />

      <div className="medical-card p-6">
        <p className="section-header">Iniciar Atendimento</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/consulta/nova">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Gravar Consulta</p>
                <p className="text-sm text-muted-foreground">
                  Capturar audio do atendimento
                </p>
              </div>
            </div>
          </Link>
          <Link href="/consulta/nova">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-secondary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Importar Audio</p>
                <p className="text-sm text-muted-foreground">
                  Enviar arquivo gravado
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>



      {/* Recent Visits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Atendimentos Recentes
          </h2>
        </div>

        {loading ? (
          <div className="medical-card p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground mt-4">
              Carregando atendimentos...
            </p>
          </div>
        ) : visits.length === 0 ? (
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-2">
              Nenhum atendimento registrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Inicie seu primeiro atendimento para comecar a documentar
              consultas
            </p>
            <Link href="/consulta/nova">
              <Button className="rounded-xl">Iniciar Atendimento</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.slice(0, 10).map((visit) => {
              const status = getVisitStatus(visit);
              return (
                <Link key={visit.id} href={`/consulta/${visit.id}`}>
                  <div className="medical-card p-4 hover:shadow-md transition-shadow cursor-pointer group relative">
                    <div className="flex items-center gap-4">
                      {/* Patient Avatar */}
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-medium text-accent-foreground">
                          {visit.patient.name[0].toUpperCase()}
                        </span>
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {visit.patient.name}
                          </p>
                          {visit.patient.age && (
                            <span className="text-sm text-muted-foreground">
                              {visit.patient.age} anos
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(visit.createdAt)}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}
                          ></div>
                          <span className="text-sm text-muted-foreground hidden sm:inline">
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        {/* Delete Button (Visible on Hover) */}
                        <button
                          onClick={(e) => handleDeleteVisit(e, visit.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Apagar Consulta"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>

                        <svg
                          className="w-5 h-5 text-muted-foreground"
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
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-muted-foreground py-4">
        <p>
          O MedScribe auxilia na documentacao clinica. A responsabilidade pelas
          decisoes medicas e do profissional.
        </p>
      </div>
    </div>
  );
}
