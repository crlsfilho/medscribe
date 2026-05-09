import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  // Admin only check
  const isSuperAdmin = session?.user?.email === "carlos@worldpackers.com" || session?.user?.impersonatedFromEmail === "carlos@worldpackers.com";
  
  if (!isSuperAdmin) {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Query User and KPIs
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          visits: true,
          patients: true,
          appointments: true,
        }
      },
      visits: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          patient: {
            select: { name: true }
          }
        }
      }
    }
  });

  if (!user) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold">Usuário não encontrado</h1>
        <Link href="/admin" className="text-primary mt-4 inline-block hover:underline">
          Voltar para Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao Admin
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {user.name || "Usuário sem nome"}
            {user.isAdmin && (
               <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">Admin</span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-3">
             <span>{user.email}</span>
             <span>&bull;</span>
             <span>Membro desde {format(new Date(user.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
          </p>
        </div>
        <Link 
           href={`/api/admin/impersonate?userId=${user.id}`}
           className="inline-flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Impersonar Médico
        </Link>
      </div>

      {/* Perfil Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">Especialidade</p>
          <p className="font-semibold text-foreground">{user.specialty || "Não informada"}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">CRM</p>
          <p className="font-semibold text-foreground">{user.crm ? `${user.crm} - ${user.crmUf}` : "Não informado"}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">Telefone</p>
          <p className="font-semibold text-foreground">{user.phoneNumber || "-"}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">Clínica</p>
          <p className="font-semibold text-foreground">{user.clinicName || "Independente"}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <h2 className="text-xl font-bold mt-10 mb-4">Volume de Uso</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
            </div>
            <div>
               <p className="text-sm font-medium text-indigo-900/70 dark:text-indigo-200/70">Consultas via I.A</p>
               <h3 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{user._count.visits}</h3>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/20 dark:to-slate-900 border border-teal-100 dark:border-teal-900/50 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
            </div>
            <div>
               <p className="text-sm font-medium text-teal-900/70 dark:text-teal-200/70">Pacientes Únicos</p>
               <h3 className="text-3xl font-bold text-teal-900 dark:text-teal-100">{user._count.patients}</h3>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-slate-900 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
            </div>
            <div>
               <p className="text-sm font-medium text-amber-900/70 dark:text-amber-200/70">Agendamentos Criados</p>
               <h3 className="text-3xl font-bold text-amber-900 dark:text-amber-100">{user._count.appointments}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico recente */}
      <h2 className="text-xl font-bold mt-10 mb-4">10 Últimas Consultas Criadas</h2>
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {user.visits.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <svg className="w-12 h-12 mb-3 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Nenhuma consulta realizada por este usuário ainda.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Data da Consulta</th>
                <th className="px-6 py-4 font-semibold">Paciente</th>
                <th className="px-6 py-4 font-semibold text-center">Tamanho do Áudio</th>
                <th className="px-6 py-4 font-semibold">Status do SOAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {user.visits.map((visit) => (
                <tr key={visit.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {format(new Date(visit.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {visit.patient?.name || "Desconhecido"}
                  </td>
                  <td className="px-6 py-4 text-center">
                     {visit.audioUrl ? (
                         <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium border border-green-200">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg> Gravado
                         </span>
                     ) : (
                         <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-xs font-medium border border-slate-200">
                             Sem Áudio
                         </span>
                     )}
                  </td>
                  <td className="px-6 py-4 max-w-[200px]">
                    {visit.soapJson ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        SOAP Completo
                      </span>
                    ) : visit.transcriptText ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Apenas Transcrição
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        Em Trâmite
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
