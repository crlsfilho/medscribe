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

    if (loading || articles.length === 0) return null;

    return (
        <div className="w-full relative mt-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Radar Médico Atualizado (Sua Especialidade)</h3>
            
            {/* Single One-Liner News Banner */}
            {articles.length > 0 && (() => {
                const article = articles[0];
                const isPubmed = article.source.name.toLowerCase().includes("pubmed");
                const isGov = article.source.name.toLowerCase().includes("gov") || article.url.includes("gov.br");
                
                return (
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full md:w-auto flex items-center gap-3 bg-white border border-slate-200/60 rounded-xl px-3 py-2.5 hover:border-emerald-300 hover:shadow-sm transition-all group relative overflow-hidden"
                    >
                        {/* Decorative Gradient */}
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-10 pointer-events-none ${isPubmed ? 'bg-indigo-500' : isGov ? 'bg-amber-500' : 'bg-emerald-500'} -translate-y-8 translate-x-8`} />
                        
                        {/* Source Tag */}
                        <div className="flex items-center gap-1.5 shrink-0 z-10">
                            <span className={`relative flex h-1.5 w-1.5`}>
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPubmed ? 'bg-indigo-400' : isGov ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isPubmed ? 'bg-indigo-500' : isGov ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {article.source.name}
                            </span>
                        </div>
                        
                        {/* Title (One liner) */}
                        <h4 className="text-sm font-medium text-slate-800 truncate group-hover:text-emerald-700 transition-colors z-10 flex-1" title={article.title}>
                            {article.title}
                        </h4>
                        
                        {/* Arrow icon */}
                        <svg className="w-3.5 h-3.5 shrink-0 text-slate-300 group-hover:text-emerald-500 transition-colors z-10 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </a>
                );
            })()}
        </div>
    );
}
