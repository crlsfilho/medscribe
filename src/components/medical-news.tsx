"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Article {
    title: string;
    url: string;
    source: { name: string };
}

export function MedicalNews() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch("/api/news");
                const data = await res.json();
                setArticles(data.articles || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    useEffect(() => {
        if (articles.length === 0) return;

        const interval = setInterval(() => {
            setFade(false); // Start fade out
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % articles.length);
                setFade(true); // Fade in
            }, 300); // Wait for fade out animation
        }, 5000); // Rotate every 5 seconds

        return () => clearInterval(interval);
    }, [articles]);

    if (loading || articles.length === 0) return null;

    const currentArticle = articles[currentIndex];

    return (
        <div className="flex items-center gap-3 bg-muted/30 border border-border/40 rounded-full px-4 py-1.5 w-full max-w-full md:w-fit md:max-w-2xl overflow-hidden">
            {/* Live Indicator */}
            <div className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
                <span className={cn("absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping", fade && "animate-none")} />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>

            {/* Ticker Text */}
            <div className="min-w-0 flex-1 flex items-center gap-2 overflow-hidden">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 whitespace-nowrap">
                    {currentArticle.source.name}
                </span>
                <span className="text-muted-foreground/40 text-[10px] shrink-0">•</span>
                <a
                    href={currentArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "text-xs text-foreground/80 hover:text-primary truncate transition-opacity duration-300",
                        fade ? "opacity-100" : "opacity-0"
                    )}
                >
                    {currentArticle.title}
                </a>
            </div>
        </div>
    );
}
