"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import PostHogPageView from "./posthog-pageview";

if (typeof window !== "undefined") {
  posthog.init("phc_tP5WBcUgUUqNGRVTMxB4PCLgrx55a3UjVnmogi73fQMW", {
    api_host: "https://us.i.posthog.com",
    ui_host: "https://us.posthog.com",
    capture_pageview: false,
    capture_exceptions: true,
  });
}

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
