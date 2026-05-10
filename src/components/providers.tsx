"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import PostHogPageView from "./posthog-pageview";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogPageView />
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <SessionProvider>
          {children}
          <Toaster position="top-right" />
        </SessionProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
}
