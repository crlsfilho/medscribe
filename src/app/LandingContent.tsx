"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
    Mic,
    Menu,
    ArrowRight,
    Check,
    Lock,
    ChevronDown,
} from "lucide-react";

export default function LandingContent() {
    const [isStickyCtaVisible, setIsStickyCtaVisible] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const navbarRef = useRef<HTMLElement>(null);

    // Fade-up Animation Logic
    useEffect(() => {
        const fadeElements = document.querySelectorAll(".fade-up");
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                    }
                });
            },
            { threshold: 0.1 }
        );
        fadeElements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // Sticky CTA Logic
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 600) {
                setIsStickyCtaVisible(true);
            } else {
                setIsStickyCtaVisible(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <div className="font-sans antialiased text-snug-text overflow-x-hidden bg-snug-bg min-h-screen">
            <style jsx global>{`
        .fade-up {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .faq-content {
          transition: all 0.3s ease-in-out;
          max-height: 0;
          opacity: 0;
          overflow: hidden;
        }
        .faq-content.open {
          max-height: 200px;
          opacity: 1;
          padding-bottom: 20px;
        }
      `}</style>

            {/* 1. Navegação */}
            <header
                ref={navbarRef}
                className="fixed top-0 w-full z-50 bg-snug-bg border-b border-snug-text/20 transition-all duration-300"
            >
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-8 h-8 rounded-[1px] bg-snug-text text-white flex items-center justify-center transition-transform group-hover:scale-105">
                            <Mic className="w-4 h-4" />
                        </div>
                        <span className="font-serif text-2xl font-semibold tracking-tight text-snug-text">Steto</span>
                    </Link>

                    <nav className="hidden md:flex gap-8 font-semibold text-snug-muted text-[12px] uppercase tracking-widest">
                        <a href="#como-funciona" className="hover:text-snug-text transition-colors">Produto</a>
                        <a href="#funcionalidades" className="hover:text-snug-text transition-colors">Funcionalidades</a>
                        <a href="#depoimentos" className="hover:text-snug-text transition-colors">Resultados</a>
                        <a href="#faq" className="hover:text-snug-text transition-colors">FAQ</a>
                    </nav>

                    <div className="hidden md:flex items-center gap-5">
                        <Link href="/login" className="font-semibold text-snug-text hover:text-snug-sage transition-colors text-[12px] uppercase tracking-wider">
                            Entrar
                        </Link>
                        <Link
                            href="/register"
                            className="bg-snug-text text-white px-5 py-2.5 rounded-[1px] font-bold text-[12px] uppercase tracking-wider hover:bg-black transition-all border border-snug-text flex items-center gap-2"
                        >
                            Testar Grátis
                        </Link>
                    </div>

                    <button className="md:hidden text-snug-text p-2" aria-label="Menu">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main>
                {/* 2. Hero Section */}
                <section className="pt-32 pb-20 px-6 overflow-hidden relative border-b border-snug-text/20 bg-snug-bg">
                    <div className="max-w-7xl mx-auto flex flex-col items-start gap-12 relative z-10">
                        {/* Copy */}
                        <div className="w-full flex flex-col justify-center fade-up max-w-5xl">
                            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif font-medium leading-[1.05] tracking-tighter mb-8 text-snug-text">
                                A sua atenção é do paciente. <br />
                                <span className="text-snug-sage italic">O relatório, deixe com a IA.</span>
                            </h1>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end w-full">
                                <p className="text-lg text-snug-text leading-relaxed">
                                    O Steto ouve a sua consulta, separa as vozes e gera automaticamente um <strong>prontuário SOAP estruturado, receitas e atestados</strong> em 30 segundos. Poupe 2 horas por dia.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
                                    <Link
                                        href="/register"
                                        className="w-full sm:w-auto bg-snug-text text-white px-8 py-4 rounded-[1px] text-[14px] font-bold uppercase tracking-wider hover:bg-black transition-all border border-snug-text flex justify-center items-center gap-2"
                                    >
                                        Testar Gratuitamente
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <div className="flex flex-col text-[11px] text-snug-muted font-bold uppercase tracking-widest">
                                        <span className="flex items-center gap-1">
                                            <Check className="w-3 h-3 text-snug-text" /> Sem cartão
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Check className="w-3 h-3 text-snug-text" /> Cancele quando quiser
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mockup - Documentary Sharp Edges */}
                        <div className="w-full relative fade-up mt-8">
                            <div className="bg-white border border-snug-text/20 flex flex-col rounded-[1px]">
                                <div className="bg-snug-bg border-b border-snug-text/20 px-4 py-3 flex items-center justify-between">
                                    <div className="text-[11px] font-mono text-snug-text uppercase tracking-widest flex items-center gap-2">
                                        [ PROTOCOLO DE REGISTO ]
                                    </div>
                                    <div className="text-[11px] font-mono font-bold text-snug-muted flex items-center gap-2">
                                        <Lock className="w-3 h-3" /> APP.STETO.PT
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 bg-white">
                                    {/* Panel 1: Recording */}
                                    <div className="p-8 border-b md:border-b-0 md:border-r border-snug-text/20 flex flex-col">
                                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-snug-text/10">
                                            <div className="flex items-center gap-2 text-snug-terra-hover font-bold text-xs uppercase tracking-widest">
                                                <div className="w-2 h-2 bg-snug-terra rounded-none animate-pulse"></div>
                                                A Gravar Transcrição
                                            </div>
                                            <span className="text-xs font-mono font-bold text-snug-text">04:12</span>
                                        </div>

                                        <div className="space-y-6 text-sm font-medium">
                                            <div className="pl-4 border-l-2 border-snug-text/20">
                                                <p className="text-[11px] font-bold text-snug-muted uppercase tracking-wider mb-2">Médico</p>
                                                <p className="text-snug-text leading-relaxed">"E essa dor de cabeça, começou quando?"</p>
                                            </div>
                                            <div className="pl-4 border-l-2 border-snug-terra/40">
                                                <p className="text-[11px] font-bold text-snug-terra-hover uppercase tracking-wider mb-2">Paciente</p>
                                                <p className="text-snug-text leading-relaxed">"Faz uns 3 dias, doutor. Latejando muito."</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Panel 2: Result */}
                                    <div className="p-8 bg-[#FCFBF9] flex flex-col">
                                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-snug-text/10">
                                            <h3 className="font-bold font-serif text-snug-text text-lg">
                                                Prontuário Clínico Gerado
                                            </h3>
                                            <span className="text-[10px] uppercase font-bold border border-snug-text text-snug-text px-2 py-1 rounded-[1px]">Processado</span>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[11px] font-bold text-snug-muted uppercase tracking-wider mb-2">Subjetivo (S)</p>
                                                <p className="text-sm text-snug-text leading-relaxed font-serif">Cefaleia latejante de forte intensidade com início há 3 dias. Nega sintomas visuais e febre...</p>
                                            </div>
                                            <div className="pt-4 border-t border-snug-text/10">
                                                <p className="text-[11px] font-bold text-snug-muted uppercase tracking-wider mb-3">Ações e Anexos (A)</p>
                                                <div className="flex gap-2">
                                                    <span className="border border-snug-text/30 text-snug-text text-[11px] px-3 py-1 font-bold uppercase tracking-wider rounded-[1px]">
                                                        [+] Receita_Médica.pdf
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Social Proof Bar */}
                <section className="py-8 bg-white border-b border-snug-text/20">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[11px] font-bold text-snug-text uppercase tracking-widest">Confiança em Clínicas de Ponta</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-80">
                            <span className="font-serif text-xl font-medium text-snug-text">CardioCenter</span>
                            <span className="font-serif text-xl font-medium text-snug-text">Pediatria+</span>
                            <span className="font-serif text-xl font-medium text-snug-text">NeuroClin</span>
                            <span className="font-serif text-xl font-medium text-snug-text">Dermato Vida</span>
                        </div>
                    </div>
                </section>

                {/* 4. Funcionalidades (Documentary Layout) */}
                <section className="py-24 px-6 bg-snug-bg border-b border-snug-text/20" id="funcionalidades">
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
                        <div className="w-full lg:w-1/3 fade-up">
                            <h2 className="text-4xl md:text-5xl font-serif font-medium mb-6 text-snug-text tracking-tight">Muito mais do que um transcritor.</h2>
                            <p className="text-[15px] text-snug-text/80 leading-relaxed">
                                O Steto foi desenhado para eliminar a burocracia clínica de ponta a ponta. 
                                Nenhuma formatação artificial, apenas dados estruturados exatamente como você ditaria.
                            </p>
                        </div>

                        <div className="w-full lg:w-2/3 border-t border-snug-text/20">
                            {[
                                {
                                    title: "Estruturação SOAP Inteligente",
                                    desc: "A IA não faz apenas o ditado. Ela compreende a narrativa clínica e aloca os sintomas, exame físico, diagnóstico e plano nos locais corretos do relatório em segundos."
                                },
                                {
                                    title: "Documentos a 1 Clique",
                                    desc: "Receitas, atestados e pedidos de exames são deduzidos da conversa e gerados automaticamente, prontos para impressão."
                                },
                                {
                                    title: "Portal do Paciente Segregado",
                                    desc: "Envie tudo para o telemóvel do paciente via link seguro. Zero papel na sua clínica, 100% focado na relação médica."
                                },
                                {
                                    title: "Segurança Nível Bancário",
                                    desc: "O sigilo médico é absoluto. Os dados são processados com anonimização na origem, garantindo total conformidade com o RGPD e HIPAA."
                                }
                            ].map((item, i) => (
                                <div key={i} className="py-8 border-b border-snug-text/20 fade-up grid grid-cols-1 md:grid-cols-5 gap-6">
                                    <div className="md:col-span-2">
                                        <h3 className="text-xl font-serif font-medium text-snug-text">{item.title}</h3>
                                    </div>
                                    <div className="md:col-span-3">
                                        <p className="text-sm text-snug-text/80 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 5. CRO Section (Tabela de Verdade) */}
                <section className="py-24 px-6 bg-[#FCFBF9] border-b border-snug-text/20">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-12 fade-up">
                            <h2 className="text-3xl font-serif font-medium mb-2 text-snug-text tracking-tight">Análise de Eficiência Clínica</h2>
                            <p className="text-[11px] font-bold text-snug-muted uppercase tracking-widest">Nota fiscal de tempo devolvido aos médicos</p>
                        </div>

                        <div className="border border-snug-text/20 fade-up bg-white rounded-[1px]">
                            <div className="grid grid-cols-3 border-b border-snug-text/20 bg-snug-bg p-5 text-[11px] font-bold text-snug-text uppercase tracking-widest">
                                <div>Métrica Operacional</div>
                                <div>Modo Manual</div>
                                <div className="text-snug-sage font-black">Com Steto</div>
                            </div>

                            <div className="grid grid-cols-3 p-5 border-b border-snug-text/10 items-center text-sm">
                                <div className="font-medium text-snug-text">Tempo por Registo Clínico</div>
                                <div className="font-mono text-snug-muted">10-15 min</div>
                                <div className="font-mono font-bold text-snug-sage">00:30 min</div>
                            </div>

                            <div className="grid grid-cols-3 p-5 border-b border-snug-text/10 items-center text-sm">
                                <div className="font-medium text-snug-text">Atenção ao Paciente</div>
                                <div className="text-snug-terra">Dividida com a tela</div>
                                <div className="font-bold text-snug-sage">100% Presencial</div>
                            </div>

                            <div className="grid grid-cols-3 p-5 items-center text-sm">
                                <div className="font-medium text-snug-text">Geração de Documentos</div>
                                <div className="text-snug-muted">Digitados manualmente</div>
                                <div className="font-bold text-snug-sage">Deduzidos pela IA</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. Depoimentos (Grid de Citações Documentais) */}
                <section className="py-24 px-6 bg-white border-b border-snug-text/20" id="depoimentos">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-16 fade-up">
                            <h2 className="text-4xl font-serif font-medium mb-4 text-snug-text tracking-tight">Casos de Uso na Prática</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-snug-text/20">
                            {[
                                {
                                    name: "Dra. Sofia Martins",
                                    specialty: "Medicina Geral e Familiar",
                                    text: "\"O fim do dia costumava ser 1 hora e meia só a atualizar as fichas clínicas pendentes. Agora eu gravo a consulta, aprovo em 10 segundos e vou para casa jantar com a minha família.\"",
                                },
                                {
                                    name: "Dr. Pedro Almeida",
                                    specialty: "Pediatria",
                                    text: "\"A formatação SOAP é clinicamente precisa. Ela pega numa conversa caótica com pais e filhos e estrutura um relatório médico perfeito. Mudou a dinâmica do meu consultório.\"",
                                },
                                {
                                    name: "Dra. Marta Castro",
                                    specialty: "Dermatologia",
                                    text: "\"O facto de gerar a receita e a rotina de skincare para enviar logo pelo telemóvel à paciente justifica o investimento por si só. Zero atritos operativos.\"",
                                },
                            ].map((d, i) => (
                                <div key={i} className="p-8 border-b border-r border-snug-text/20 fade-up bg-snug-bg/30">
                                    <p className="text-snug-text leading-relaxed font-serif text-lg mb-8">
                                        {d.text}
                                    </p>
                                    <div>
                                        <h4 className="font-bold text-sm text-snug-text uppercase tracking-wider">{d.name}</h4>
                                        <p className="text-snug-muted text-[11px] uppercase tracking-widest mt-1">{d.specialty}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 7. FAQ & CTA */}
                <section className="py-24 px-6 bg-snug-bg flex flex-col md:flex-row gap-16 border-b border-snug-text/20" id="faq">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 w-full">
                        <div className="flex-1 fade-up">
                            <h2 className="text-3xl font-serif font-medium mb-8 text-snug-text tracking-tight">Informações Técnicas & FAQ</h2>
                            
                            <div className="border-t border-snug-text/20">
                                {[
                                    {
                                        q: "A IA pode cometer erros clínicos na transcrição?",
                                        a: "A nossa IA tem precisão superior em terminologia médica graças a modelos de linguagem especializados. Contudo, o Steto funciona como um copiloto assistente: o médico deve sempre rever e aprovar o relatório final.",
                                    },
                                    {
                                        q: "É seguro para os dados sensíveis dos meus pacientes?",
                                        a: "Total conformidade com RGPD e HIPAA. Os dados de voz são processados para extração de texto, encriptados em trânsito e repouso, e nunca armazenados para treino de algoritmos públicos.",
                                    },
                                    {
                                        q: "Preciso de instalar algum software local?",
                                        a: "Não. A infraestrutura opera integralmente na cloud. O acesso é feito via browser no computador clínico, e o telemóvel pode ser usado como microfone auxiliar sem necessidade de app nativa.",
                                    },
                                ].map((item, i) => (
                                    <div key={i} className="border-b border-snug-text/20">
                                        <button
                                            className="w-full text-left py-5 font-bold text-snug-text flex justify-between items-center focus:outline-none text-sm uppercase tracking-wider"
                                            onClick={() => toggleFaq(i)}
                                        >
                                            {item.q}
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaqIndex === i ? "rotate-180" : ""}`} />
                                        </button>
                                        <div className={`faq-content ${openFaqIndex === i ? "open" : ""}`}>
                                            <div className="pb-5 text-snug-text/80 text-sm leading-relaxed">
                                                {item.a}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Integradado */}
                        <div className="w-full md:w-[450px] bg-white border border-snug-text/20 p-10 fade-up flex flex-col justify-center rounded-[1px]">
                            <h2 className="text-3xl font-serif font-medium mb-6 text-snug-text tracking-tight leading-tight">
                                Recupere 40 horas operacionais este mês.
                            </h2>
                            <p className="text-[13px] text-snug-muted mb-8 leading-relaxed font-medium">
                                Operação imediata. O teste é gratuito, sem cartão de crédito e sem obrigações de fidelidade.
                            </p>
                            
                            <Link
                                href="/register"
                                className="bg-snug-text text-white px-8 py-4 text-center font-bold text-[13px] uppercase tracking-widest hover:bg-black transition-colors border border-snug-text rounded-[1px]"
                            >
                                Parar de Digitar Hoje
                            </Link>

                            <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-snug-text/10">
                                <span className="flex items-center gap-3 text-snug-text text-[11px] font-bold uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 bg-snug-sage"></div> Setup em 30s
                                </span>
                                <span className="flex items-center gap-3 text-snug-text text-[11px] font-bold uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 bg-snug-text"></div> Privado & Seguro
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* 8. Footer */}
            <footer className="bg-white py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 text-snug-text">
                        <div className="w-6 h-6 bg-snug-text text-white flex items-center justify-center rounded-[1px]">
                            <Mic className="w-3 h-3" />
                        </div>
                        <span className="font-serif text-lg font-bold">Steto</span>
                    </Link>

                    <div className="flex gap-8 text-[11px] font-bold text-snug-muted uppercase tracking-widest">
                        <a href="#como-funciona" className="hover:text-snug-text transition-colors">Produto</a>
                        <a href="#faq" className="hover:text-snug-text transition-colors">Privacidade (RGPD)</a>
                        <a href="mailto:suporte@steto.pt" className="hover:text-snug-text transition-colors">Suporte</a>
                    </div>

                    <p className="text-[11px] font-mono font-bold text-snug-muted/50">
                        VER_2026 // STETO SYSTEMS
                    </p>
                </div>
            </footer>
        </div>
    );
}
