"use client";

import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding-flow";

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    // Redirect to dashboard after completion
    router.push("/dashboard");
    router.refresh();
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
