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
            
            <div className="flex flex-col sm:flex-row overflow-x-auto gap-5 pb-6 no-scrollbar -mx-2 px-2 snap-x">
                {articles.map((article, idx) => {
                    const isPubmed = article.source.name.toLowerCase().includes("pubmed");
                    const isGov = article.source.name.toLowerCase().includes("gov") || article.url.includes("gov.br");
                    return (
                        <a
                            key={idx}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-[200px] sm:w-[240px] bg-white border border-slate-200/60 rounded-2xl p-3 shrink-0 hover:border-emerald-300 hover:shadow-md transition-all group snap-start flex flex-col justify-between relative overflow-hidden"
                        >
                            {/* Decorative Background Gradient */}
                            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-10 pointer-events-none ${isPubmed ? 'bg-indigo-500' : isGov ? 'bg-amber-500' : 'bg-emerald-500'} -translate-y-8 translate-x-8`} />
                            
                            <div className="z-10 relative">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className={`relative flex h-1.5 w-1.5`}>
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPubmed ? 'bg-indigo-400' : isGov ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isPubmed ? 'bg-indigo-500' : isGov ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                    </span>
                                    <span className="text-[9px] font-bold truncate uppercase tracking-widest text-slate-400">
                                        {article.source.name}
                                    </span>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-800 leading-tight truncate group-hover:text-emerald-700 transition-colors" title={article.title}>
                                    {article.title}
                                </h4>
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between z-10 relative">
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {new Date(article.publishedAt).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                                </p>
                                <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
