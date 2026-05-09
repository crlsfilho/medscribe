import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Admin Dashboard - Medscribe",
};

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    onboardedUsers,
    totalVisits,
    totalPatients,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboardingComplete: true } }),
    prisma.visit.count(),
    prisma.patient.count(),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        createdAt: true,
        onboardingComplete: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Painel de Administração</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Visão geral do sistema SaaS Medscribe. Acompanhe métricas, adesão e crescimento.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40 backdrop-blur-3xl border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <svg
              className="w-4 h-4 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados na base</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-3xl border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Adesão Concluída (Onboarding)
            </CardTitle>
            <svg
              className="w-4 h-4 text-emerald-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{onboardedUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((onboardedUsers / Math.max(1, totalUsers)) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-3xl border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Consultas</CardTitle>
            <svg
              className="w-4 h-4 text-indigo-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75H12a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 0112 4.5h0a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{totalVisits}</div>
            <p className="text-xs text-muted-foreground mt-1">Geradas via IA</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-3xl border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pacientes Cadastrados</CardTitle>
            <svg
              className="w-4 h-4 text-amber-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">Na base dos médicos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="bg-card/40 backdrop-blur-3xl border-white/10 shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl">Últimos Registros (10 mais recentes)</CardTitle>
            <CardDescription>
              Acompanhamento de novos usuários que se inscreveram no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium">Médico / Clinic Name</th>
                    <th scope="col" className="px-6 py-4 font-medium">E-mail</th>
                    <th scope="col" className="px-6 py-4 font-medium">Especialidade</th>
                    <th scope="col" className="px-6 py-4 font-medium">Situação</th>
                    <th scope="col" className="px-6 py-4 font-medium">Ingresso</th>
                    <th scope="col" className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {u.name || "Sem Nome"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        {u.specialty ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {u.specialty}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Não Informada</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.onboardingComplete ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-none">
                            Pendente
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(u.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/admin/users/${u.id}`}
                            className="text-xs bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                          >
                            Ver Perfil
                          </Link>
                          <a 
                            href={`/api/admin/impersonate?userId=${u.id}`}
                            className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
                          >
                            Impersonar
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        Nenhum usuário registrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
