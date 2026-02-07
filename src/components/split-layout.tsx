"use client";

import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SplitLayoutProps {
    children: ReactNode; // Center: SOAP
    leftPanel: ReactNode; // Left: Transcript
    rightPanel?: ReactNode; // Right: AI (Optional)
}

type MobileView = "transcript" | "soap" | "ai";

export function SplitLayout({ leftPanel, children, rightPanel }: SplitLayoutProps) {
    const [isDesktop, setIsDesktop] = useState(true);

    // Desktop States
    const [isRightOpen, setIsRightOpen] = useState(true);
    const [isLeftOpen, setIsLeftOpen] = useState(true);

    // Mobile States
    const [mobileView, setMobileView] = useState<MobileView>("soap");

    useEffect(() => {
        const checkScreen = () => setIsDesktop(window.innerWidth >= 1024);
        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    // --- MOBILE LAYOUT (Tabs) ---
    if (!isDesktop) {
        return (
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                {/* Mobile Tab Switcher */}
                <div className="flex p-2 gap-2 bg-card/50 border-b border-border/50 shrink-0 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setMobileView("transcript")}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${mobileView === "transcript"
                            ? "bg-foreground text-background shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {rightPanel ? "Transcrição" : "Contexto & IA"}
                    </button>
                    <button
                        onClick={() => setMobileView("soap")}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${mobileView === "soap"
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        Prontuário
                    </button>
                    {rightPanel && (
                        <button
                            onClick={() => setMobileView("ai")}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${mobileView === "ai"
                                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            IA Assistant
                        </button>
                    )}
                </div>

                {/* Mobile Content Area */}
                <div className="flex-1 overflow-hidden relative p-3">
                    {mobileView === "transcript" && (
                        <div className="h-full overflow-y-auto animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="bg-card border border-border rounded-xl p-3 shadow-sm min-h-full">
                                {leftPanel}
                            </div>
                        </div>
                    )}

                    {mobileView === "soap" && (
                        <div className="h-full overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
                            {children}
                        </div>
                    )}

                    {mobileView === "ai" && (
                        <div className="h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-card border border-border rounded-xl shadow-sm min-h-full h-full">
                                {/* Force render the evidence panel contents */}
                                <div className="h-full flex flex-col">
                                    {rightPanel}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- DESKTOP LAYOUT (Split) ---
    return (
        <div className="flex h-[calc(100vh-5rem)] overflow-hidden gap-4 p-4">
            {/* LEFT PANEL: Transcription / Context */}
            <div
                className={`transition-all duration-300 ease-in-out flex flex-col ${isLeftOpen ? "w-[40%] min-w-[350px] max-w-[500px]" : "w-12 bg-muted/30 rounded-xl"
                    }`}
            >
                <div className="flex-1 overflow-hidden bg-card border border-border rounded-xl shadow-sm relative">
                    {isLeftOpen ? leftPanel : (
                        <button onClick={() => setIsLeftOpen(true)} className="w-full h-full flex flex-col items-center pt-8 gap-4 text-muted-foreground hover:text-primary transition-colors">
                            <span className="rotate-90 whitespace-nowrap text-sm font-medium tracking-wide">Transcrição</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                    )}
                    {isLeftOpen && (
                        <button
                            onClick={() => setIsLeftOpen(false)}
                            className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-muted rounded-lg"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* CENTER PANEL: Main Work (SOAP) */}
            <div className="flex-1 overflow-hidden bg-card/50 border border-border/50 rounded-xl shadow-sm flex flex-col relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>

            {/* RIGHT PANEL: AI & Evidence (The Hype) - Only render if provided */}
            {rightPanel && (
                <div
                    className={`transition-all duration-300 ease-in-out flex flex-col ${isRightOpen ? "w-[350px] xl:w-[400px]" : "w-12 h-12 self-start mt-4 rounded-xl"
                        }`}
                >
                    <div className={`flex-1 overflow-hidden rounded-xl border relative transition-all h-full ${isRightOpen
                        ? "bg-gradient-to-b from-card to-muted/20 border-primary/20 shadow-[0_0_30px_-10px_rgba(var(--primary),0.1)]"
                        : "bg-muted/30 border-transparent"
                        }`}>
                        {!isRightOpen && (
                            <button onClick={() => setIsRightOpen(true)} className="w-full h-full flex flex-col items-center justify-center text-primary bg-card border border-border rounded-xl shadow-sm hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                                </svg>
                            </button>
                        )}

                        {isRightOpen && (
                            <>
                                {/* Header for Hype Panel */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-indigo-500 opacity-80 z-10" />

                                <div className="h-full flex flex-col">
                                    <div className="p-3 flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-[10px] font-bold text-white shadow-sm">
                                                AI
                                            </span>
                                            <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                                Assistente
                                            </span>
                                        </div>
                                        <button onClick={() => setIsRightOpen(false)} className="text-muted-foreground hover:text-foreground">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        {rightPanel}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
