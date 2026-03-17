import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Configurações - MedScribe",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      crm: true,
      crmUf: true,
      specialty: true,
      onboardingComplete: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Calculate Onboarding Progression
  const checkSteps = [
    { name: "Criar Conta", isDone: true },
    { name: "Verificar Email", isDone: !!user.email },
    { name: "Completar Perfil Profissional", isDone: !!(user.crm && user.crmUf && user.specialty) },
    { name: "Onboarding Final", isDone: user.onboardingComplete },
  ];

  const completedSteps = checkSteps.filter((step) => step.isDone).length;
  const progressPercent = Math.round((completedSteps / checkSteps.length) * 100);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu perfil e acompanhe seu onboarding</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_350px]">
        
        {/* Left Column: Profile Config */}
        <div className="space-y-6">
          <div className="bg-card border-2 border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              Dados do Perfil
            </h2>
            
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Nome Completo</label>
                  <div className="h-12 px-4 rounded-xl border border-input bg-muted/30 flex items-center text-foreground font-medium">
                    {user.name}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Email</label>
                  <div className="h-12 px-4 rounded-xl border border-input bg-muted/30 flex items-center text-foreground font-medium">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Especialidade</label>
                  <div className="h-12 px-4 rounded-xl border border-input bg-muted/30 flex items-center text-foreground font-medium">
                    {user.specialty || "Não informado"}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_80px] gap-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">CRM</label>
                    <div className="h-12 px-4 rounded-xl border border-input bg-muted/30 flex items-center text-foreground font-medium">
                      {user.crm || "---"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">UF</label>
                    <div className="h-12 px-4 rounded-xl border border-input bg-muted/30 flex items-center text-foreground font-medium">
                      {user.crmUf || "--"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <Link href="/onboarding">
                <Button variant="outline" className="rounded-xl h-12">
                  Editar Dados no Onboarding
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Onboarding Progression Widget */}
        <div className="space-y-6">
          <div className="bg-card border-2 border-primary/20 bg-primary/5 rounded-2xl p-6 shadow-sm sticky top-24">
            <h3 className="font-bold text-lg mb-2 text-foreground">Seu Progresso</h3>
            <p className="text-sm text-muted-foreground mb-6">Complete todas as etapas para liberar 100% da plataforma.</p>
            
            <div className="mb-6 relative h-4 bg-muted overflow-hidden rounded-full">
              <div 
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-in-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="space-y-4 mb-8">
              {checkSteps.map((step, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${step.isDone ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border'}`}>
                      {step.isDone && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${step.isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {progressPercent < 100 ? (
              <div className="pt-6 border-t border-primary/10">
                <Link href="/onboarding" className="block w-full">
                  <Button size="lg" className="w-full h-14 rounded-xl text-base gap-2 font-bold shadow-md hover:-translate-y-1 transition-transform">
                    Continuar Onboarding
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="pt-6 border-t border-primary/10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Onboarding Completo!
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
