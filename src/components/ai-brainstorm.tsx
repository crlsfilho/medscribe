"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
// import ReactMarkdown from "react-markdown";

type Mode = "pharma" | "protocols" | "differential" | null;

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function AIBrainstorm() {
    const [mode, setMode] = useState<Mode>(null);
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!query.trim() || !mode) return;

        const userMsg = query;
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setQuery("");
        setLoading(true);

        try {
            const res = await fetch("/api/medical-qa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: userMsg, mode }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.answer },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Desculpe, tive um erro ao processar sua pergunta. Tente novamente.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const activeModeColor = {
        pharma: "bg-emerald-100 text-emerald-800 border-emerald-200",
        protocols: "bg-blue-100 text-blue-800 border-blue-200",
        differential: "bg-amber-100 text-amber-800 border-amber-200",
    };

    const ModeCard = ({
        id,
        title,
        desc,
        icon,
    }: {
        id: Mode;
        title: string;
        desc: string;
        icon: React.ReactNode;
    }) => (
        <div
            onClick={() => { setMode(id); setMessages([]); }}
            className={cn(
                "cursor-pointer p-6 rounded-xl border-2 transition-all hover:shadow-md",
                mode === id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/50"
            )}
        >
            <div className="flex flex-col items-center text-center gap-3">
                <div className={cn("p-3 rounded-full bg-muted", mode === id && "bg-background")}>
                    {icon}
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
            {!mode ? (
                <div className="flex-1 flex flex-col justify-center items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">
                            Qual seu objetivo agora?
                        </h2>
                        <p className="text-muted-foreground">
                            Selecione um modo para iniciar o brainstorming clínico
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full px-4">
                        <ModeCard
                            id="pharma"
                            title="Farmacologia"
                            desc="Interações, ajustes de dose e segurança."
                            icon={
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            }
                        />
                        <ModeCard
                            id="protocols"
                            title="Protocolos"
                            desc="Diretrizes oficiais e conduta padrão."
                            icon={
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            }
                        />
                        <ModeCard
                            id="differential"
                            title="Diferencial"
                            desc="Expandir hipóteses e investigar sinais."
                            icon={
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            }
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full bg-card border rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMode(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                ← Voltar
                            </Button>
                            <div
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border",
                                    // @ts-ignore
                                    activeModeColor[mode] || "bg-gray-100"
                                )}
                            >
                                {mode === "pharma" ? "Farmacologia" : mode === "protocols" ? "Diretrizes" : "Diagnóstico"}
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                <p>Faça sua pergunta para começar.</p>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex w-full",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap",
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                                            : "bg-muted text-foreground mr-auto rounded-tl-none prose prose-sm dark:prose-invert"
                                    )}
                                >
                                    {msg.role === "assistant" ? (
                                        <div className="whitespace-pre-wrap font-sans">
                                            {msg.content.split('**').map((part, i) =>
                                                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                            )}
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-muted rounded-2xl rounded-tl-none p-4 w-12 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
                                    <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-background">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearch();
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={
                                    mode === "pharma" ? "Ex: Posso usar Amoxicilina em gestante?" :
                                        mode === "protocols" ? "Ex: Qual o manejo da sepse?" :
                                            "Ex: Dor torácica e dispneia, o que investigar?"
                                }
                                className="flex-1"
                                disabled={loading}
                            />
                            <Button type="submit" disabled={loading || !query.trim()}>
                                Enviar
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
