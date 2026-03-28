import { useEffect, useState } from "react";

interface Article {
    title: string;
    url: string;
    source: { name: string };
    publishedAt: string;
}

export function MedicalNews() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

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
        if (articles.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % articles.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [articles.length]);

    if (loading || articles.length === 0) return null;

    const article = articles[currentIndex];
    const isPubmed = article.source.name.toLowerCase().includes("pubmed");
    const isGov = article.source.name.toLowerCase().includes("gov") || article.url.includes("gov.br");

    return (
        <div className="w-full sm:max-w-[320px] md:max-w-[420px] relative mt-2">
            <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2 bg-white/40 border border-slate-200/50 rounded-lg px-2.5 py-1.5 hover:bg-white/60 hover:border-emerald-200 transition-all group overflow-hidden"
            >
                <div className="flex items-center gap-1.5 shrink-0 opacity-80">
                    <span className={`relative flex h-1.5 w-1.5`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPubmed ? 'bg-indigo-400' : isGov ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isPubmed ? 'bg-indigo-500' : isGov ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {article.source.name}
                    </span>
                </div>
                
                {/* Wrap transition for fading */}
                <span 
                    key={currentIndex} 
                    className="text-[11px] font-medium text-slate-700 truncate group-hover:text-emerald-700 transition-colors animate-in fade-in duration-500 flex-1"
                    title={article.title}
                >
                    {article.title}
                </span>

                <svg className="w-3 h-3 shrink-0 text-slate-300 group-hover:text-emerald-500 transition-colors hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </a>
        </div>
    );
}
