import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingClientPage from "./page.client";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { onboardingComplete: true },
  });

  // If already onboarded, send them to the dashboard
  if (user?.onboardingComplete) {
    redirect("/dashboard");
  }

  return <OnboardingClientPage />;
}
