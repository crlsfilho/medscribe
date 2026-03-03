"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
    Mic,
    Menu,
    ArrowRight,
    Check,
    Lock,
    FileText,
    Pill,
    Activity,
    Baby,
    Brain,
    Smile,
    ShieldCheck,
    ChevronDown,
    Sparkles,
    Zap,
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
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-gentle-float {
          animation: gentle-float 5s ease-in-out infinite;
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
                className="fixed top-0 w-full z-50 bg-snug-bg/95 backdrop-blur-md border-b border-snug-sand transition-all duration-300"
            >
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-9 h-9 rounded-xl bg-snug-sage text-white flex items-center justify-center transition-transform group-hover:scale-105">
                            <Mic className="w-4 h-4" />
                        </div>
                        <span className="font-serif text-2xl font-semibold tracking-tight text-snug-text">Steto</span>
                    </Link>

                    <nav className="hidden md:flex gap-8 font-semibold text-snug-muted text-[15px]">
                        <a href="#como-funciona" className="hover:text-snug-sage transition-colors">Produto</a>
                        <a href="#funcionalidades" className="hover:text-snug-sage transition-colors">Funcionalidades</a>
                        <a href="#depoimentos" className="hover:text-snug-sage transition-colors">Resultados</a>
                        <a href="#faq" className="hover:text-snug-sage transition-colors">FAQ</a>
                    </nav>

                    <div className="hidden md:flex items-center gap-5">
                        <Link href="/login" className="font-semibold text-snug-text hover:text-snug-sage transition-colors text-[15px]">
                            Entrar
                        </Link>
                        <Link
                            href="/register"
                            className="bg-snug-text text-white px-5 py-2.5 rounded-full font-bold text-[15px] hover:bg-black transition-all shadow-sm flex items-center gap-2"
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
                <section className="pt-32 pb-20 px-6 overflow-hidden relative">
                    <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-snug-sage-light rounded-full blur-[100px] opacity-60 z-0"></div>

                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
                        {/* Left: Copy */}
                        <div className="w-full lg:w-[45%] flex flex-col justify-center fade-up">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-snug-terra/30 bg-snug-terra/10 text-snug-terra-hover font-bold text-xs mb-6 w-fit tracking-wide uppercase">
                                <span className="w-2 h-2 rounded-full bg-snug-terra animate-pulse"></span>
                                A Nova Geração da Inteligência Clínica
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-5xl font-serif font-medium leading-[1.2] mb-6 text-snug-text">
                                A sua atenção é do paciente. <br />
                                <span className="text-snug-sage font-semibold italic">O relatório, deixe com a IA.</span>
                            </h1>

                            <p className="text-lg text-snug-muted leading-relaxed mb-8">
                                O Steto ouve a sua consulta, separa as vozes e gera automaticamente um <strong>prontuário SOAP estruturado, receitas e atestados</strong> em 30 segundos. Poupe 2 horas por dia.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Link
                                    href="/register"
                                    className="w-full sm:w-auto bg-snug-sage text-white px-8 py-4 rounded-full text-base font-bold hover:bg-snug-sage-hover transition-all shadow-lg hover:-translate-y-1 flex justify-center items-center gap-2"
                                >
                                    Começar Teste Gratuito
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <div className="flex flex-col text-xs text-snug-muted font-medium">
                                    <span className="flex items-center gap-1">
                                        <Check className="w-3 h-3 text-snug-sage" /> Sem cartão de crédito
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Check className="w-3 h-3 text-snug-sage" /> Cancele quando quiser
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Mockup */}
                        <div className="w-full lg:w-[55%] relative fade-up animate-gentle-float" style={{ transitionDelay: "200ms" }}>
                            <div className="bg-white rounded-[2rem] border border-snug-sand shadow-float overflow-hidden flex flex-col">
                                <div className="bg-snug-bg/50 px-5 py-4 border-b border-snug-sand flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-snug-sage"></div>
                                    </div>
                                    <div className="text-xs font-semibold text-snug-muted flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-snug-sand">
                                        <Lock className="w-3 h-3" /> app.steto.pt
                                    </div>
                                    <div className="w-12"></div>
                                </div>

                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FCFBF9]">
                                    {/* Panel 1: Recording */}
                                    <div className="bg-white rounded-2xl p-5 border border-snug-sand shadow-card flex flex-col">
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-2 text-snug-terra-hover font-bold text-sm">
                                                <div className="w-2 h-2 rounded-full bg-snug-terra animate-pulse"></div>
                                                A Gravar
                                            </div>
                                            <span className="text-xs font-bold text-snug-muted">04:12</span>
                                        </div>

                                        <div className="space-y-4 text-sm font-medium">
                                            <div className="bg-snug-bg p-3 rounded-xl rounded-tl-none border border-snug-sand">
                                                <p className="text-xs font-bold text-snug-sage mb-1">Médico</p>
                                                <p className="text-snug-text">"E essa dor de cabeça, começou quando?"</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl rounded-tr-none border border-snug-sand shadow-sm self-end">
                                                <p className="text-xs font-bold text-snug-terra-hover mb-1 text-right">Paciente</p>
                                                <p className="text-snug-text">"Faz uns 3 dias, doutor. Latejando muito."</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Panel 2: Result */}
                                    <div className="bg-white rounded-2xl p-5 border border-snug-sage-light shadow-card relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-snug-sage-light rounded-bl-full -z-0 opacity-50"></div>

                                        <div className="flex justify-between items-center mb-4 relative z-10 border-b border-snug-sand pb-3">
                                            <h3 className="font-bold text-snug-text text-sm flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-snug-sage" /> Prontuário SOAP
                                            </h3>
                                            <span className="text-[10px] uppercase font-bold bg-snug-sage-light text-snug-sage-hover px-2 py-1 rounded-md">Concluído</span>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div>
                                                <p className="text-[10px] font-bold text-snug-muted uppercase tracking-wider mb-1">Subjetivo</p>
                                                <p className="text-xs text-snug-text leading-relaxed">Cefaleia latejante de forte intensidade com início há 3 dias. Nega sintomas visuais e febre...</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-snug-muted uppercase tracking-wider mb-2">Plano (Ações extraídas)</p>
                                                <div className="flex gap-2">
                                                    <span className="bg-snug-bg border border-snug-sand text-snug-text text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1">
                                                        <Pill className="w-3 h-3 text-snug-sage" /> Receita Gerada
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
                <section className="py-8 bg-white border-y border-snug-sand">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <p className="text-xs font-bold text-snug-muted mb-6 tracking-widest uppercase">Mais de 500 médicos já recuperaram o seu tempo livre</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 text-snug-text">
                            <span className="font-serif text-xl font-medium flex items-center gap-2 text-snug-text"><Activity className="w-6 h-6" /> CardioCenter</span>
                            <span className="font-serif text-xl font-medium flex items-center gap-2 text-snug-text"><Baby className="w-6 h-6" /> Pediatria+</span>
                            <span className="font-serif text-xl font-medium flex items-center gap-2 text-snug-text"><Brain className="w-6 h-6" /> NeuroClin</span>
                            <span className="font-serif text-xl font-medium flex items-center gap-2 text-snug-text"><Smile className="w-6 h-6" /> Dermato Vida</span>
                        </div>
                    </div>
                </section>

                {/* 4. Funcionalidades */}
                <section className="py-24 px-6 bg-snug-bg" id="funcionalidades">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-16 fade-up">
                            <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4 text-snug-text">Muito mais do que um transcritor.</h2>
                            <p className="text-lg text-snug-muted">O Steto foi desenhado para eliminar a burocracia clínica de ponta a ponta, respeitando o seu fluxo de trabalho.</p>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
                            {/* Card 1: Large */}
                            <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-snug-sand shadow-card fade-up flex flex-col md:flex-row gap-6 items-center overflow-hidden relative">
                                <div className="flex-1 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-snug-sage-light text-snug-sage-hover flex items-center justify-center mb-6">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-serif font-medium mb-3 text-snug-text">Estruturação SOAP Inteligente</h3>
                                    <p className="text-snug-muted leading-relaxed">A IA não faz apenas o ditado. Ela compreende a narrativa clínica e aloca os sintomas, exame físico, diagnóstico e plano nos locais corretos do relatório em segundos.</p>
                                </div>
                                <div className="w-full md:w-64 bg-[#FCFBF9] p-4 rounded-xl border border-snug-sand shadow-inner relative z-10">
                                    <div className="space-y-3">
                                        <div className="h-2 bg-snug-sage-light rounded w-1/3"></div>
                                        <div className="h-2 bg-snug-sand rounded w-full"></div>
                                        <div className="h-2 bg-snug-sand rounded w-5/6"></div>
                                        <div className="h-2 bg-snug-sage-light rounded w-1/4 mt-4"></div>
                                        <div className="h-2 bg-snug-sand rounded w-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Square */}
                            <div
                                className="bg-white rounded-[2rem] p-8 border border-snug-sand shadow-card fade-up flex flex-col justify-between"
                                style={{ transitionDelay: "100ms" }}
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-snug-terra/20 text-snug-terra-hover flex items-center justify-center mb-6">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-serif font-medium mb-3 text-snug-text">Documentos a 1 Clique</h3>
                                    <p className="text-snug-muted text-sm leading-relaxed">Receitas, atestados e pedidos de exames são deduzidos da conversa e gerados automaticamente.</p>
                                </div>
                                <div className="flex gap-2 flex-wrap mt-4">
                                    <span className="bg-snug-bg border border-snug-sand text-xs px-3 py-1.5 rounded-full font-bold text-snug-text">Receita</span>
                                    <span className="bg-snug-bg border border-snug-sand text-xs px-3 py-1.5 rounded-full font-bold text-snug-text">Atestado</span>
                                </div>
                            </div>

                            {/* Card 3: Square */}
                            <div
                                className="bg-white rounded-[2rem] p-8 border border-snug-sand shadow-card fade-up flex flex-col justify-between"
                                style={{ transitionDelay: "150ms" }}
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center mb-6">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-serif font-medium mb-3 text-snug-text">Portal do Paciente</h3>
                                    <p className="text-snug-muted text-sm leading-relaxed">Envie tudo para o telemóvel do paciente via link seguro. Zero papel na sua clínica.</p>
                                </div>
                            </div>

                            {/* Card 4: Large */}
                            <div
                                className="md:col-span-2 bg-snug-sage text-white rounded-[2rem] p-8 shadow-card fade-up relative overflow-hidden flex flex-col justify-center"
                                style={{ transitionDelay: "200ms" }}
                            >
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <ShieldCheck className="w-10 h-10 text-white mb-6" />
                                    <h3 className="text-2xl font-serif font-medium mb-3">Segurança Nível Bancário</h3>
                                    <p className="text-white/90 leading-relaxed max-w-lg mb-6">O sigilo médico é absoluto. Os dados são processados com anonimização na origem, garantindo total conformidade com o <strong>RGPD</strong> e <strong>HIPAA</strong>.</p>
                                    <div className="flex gap-4">
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">RGPD Compliant</span>
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">Criptografia AES-256</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. CRO Section */}
                <section className="py-24 px-6 bg-white">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16 fade-up">
                            <h2 className="text-3xl font-serif font-medium mb-4 text-snug-text">A Matemática do seu Tempo</h2>
                            <p className="text-lg text-snug-muted">Veja porque tantos médicos abandonaram o teclado.</p>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-snug-sand shadow-card overflow-hidden fade-up">
                            <div className="grid grid-cols-3 bg-snug-bg border-b border-snug-sand p-6 text-sm font-bold text-snug-text uppercase tracking-wider text-center">
                                <div className="text-left text-snug-muted">Métrica</div>
                                <div className="text-snug-muted">Modo Manual</div>
                                <div className="text-snug-sage flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Steto
                                </div>
                            </div>

                            <div className="grid grid-cols-3 p-6 border-b border-snug-bg items-center text-center">
                                <div className="text-left font-bold text-snug-text text-sm md:text-base">Tempo por Registo</div>
                                <div className="text-snug-muted">10-15 minutos</div>
                                <div className="font-bold text-snug-sage-hover bg-snug-sage-light/50 py-2 rounded-lg">30 segundos</div>
                            </div>

                            <div className="grid grid-cols-3 p-6 border-b border-snug-bg items-center text-center">
                                <div className="text-left font-bold text-snug-text text-sm md:text-base">Atenção ao Paciente</div>
                                <div className="text-snug-terra-hover">Dividida com a tela</div>
                                <div className="font-bold text-snug-sage-hover">100% Focada</div>
                            </div>

                            <div className="grid grid-cols-3 p-6 items-center text-center">
                                <div className="text-left font-bold text-snug-text text-sm md:text-base">Geração de Documentos</div>
                                <div className="text-snug-muted">Criados um a um</div>
                                <div className="font-bold text-snug-sage-hover">Deduzidos da IA</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. Depoimentos */}
                <section className="py-24 px-6 bg-snug-bg" id="depoimentos">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 fade-up">
                            <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4 text-snug-text">Resultados reais nos consultórios</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    name: "Dra. Sofia Martins",
                                    specialty: "Medicina Geral e Familiar",
                                    img: "https://images.unsplash.com/photo-1594824436998-d40d9f4dc11b?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
                                    text: "\"O fim do dia costumava ser 1 hora e meia só a atualizar as fichas clínicas pendentes. Agora eu gravo a consulta, aprovo em 10 segundos e vou para casa jantar com a minha família.\"",
                                },
                                {
                                    name: "Dr. Pedro Almeida",
                                    specialty: "Pediatria",
                                    img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
                                    text: "\"A formatação SOAP da IA é assustadoramente boa. Ela pega numa conversa caótica com pais e filhos chorando e estrutura um relatório médico perfeito. Mudou a minha clínica.\"",
                                },
                                {
                                    name: "Dra. Marta Castro",
                                    specialty: "Dermatologia",
                                    img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
                                    text: "\"O facto de gerar a receita e a rotina de skincare para enviar logo pelo telemóvel à paciente justifica o investimento por si só. Zero atritos, 100% de foco na paciente.\"",
                                },
                            ].map((d, i) => (
                                <div key={i} className="bg-white p-8 rounded-[2rem] shadow-soft border border-snug-sand/50 fade-up" style={{ transitionDelay: `${i * 100}ms` }}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <img src={d.img} alt={d.name} className="w-14 h-14 rounded-full object-cover" />
                                        <div>
                                            <h4 className="font-bold text-snug-text">{d.name}</h4>
                                            <p className="text-snug-sage font-medium text-xs">{d.specialty}</p>
                                        </div>
                                    </div>
                                    <p className="text-snug-muted leading-relaxed text-[15px] italic">{d.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 7. FAQ */}
                <section className="py-24 px-6 bg-white" id="faq">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12 fade-up">
                            <h2 className="text-3xl font-serif font-medium mb-4 text-snug-text">Perguntas Frequentes</h2>
                            <p className="text-lg text-snug-muted">Tire as suas dúvidas antes de começar o teste gratuito.</p>
                        </div>

                        <div className="space-y-4 fade-up">
                            {[
                                {
                                    q: "A IA pode cometer erros clínicos na transcrição?",
                                    a: "A nossa IA tem uma taxa de precisão de 98% em terminologia médica, graças aos modelos de linguagem avançados. Contudo, o Steto funciona como um copiloto: o médico deve sempre rever e aprovar o relatório gerado.",
                                },
                                {
                                    q: "É seguro para os dados sensíveis dos meus pacientes?",
                                    a: "Sim, totalmente. A plataforma segue estritamente as diretrizes do RGPD e HIPAA. Os dados de voz são processados para extração de texto, encriptados e nunca são armazenados para treino de algoritmos públicos.",
                                },
                                {
                                    q: "Preciso de instalar algum software?",
                                    a: "Não. O Steto funciona inteiramente na cloud. Pode aceder através do browser do seu computador na clínica, ou usar o telemóvel como microfone diretamente no Safari ou Chrome.",
                                },
                            ].map((item, i) => (
                                <div key={i} className="border border-snug-sand rounded-2xl bg-[#FCFBF9] overflow-hidden">
                                    <button
                                        className="w-full text-left px-6 py-5 font-bold text-snug-text flex justify-between items-center focus:outline-none"
                                        onClick={() => toggleFaq(i)}
                                    >
                                        {item.q}
                                        <ChevronDown className={`w-5 h-5 text-snug-sage transition-transform duration-300 ${openFaqIndex === i ? "rotate-180" : ""}`} />
                                    </button>
                                    <div className={`faq-content ${openFaqIndex === i ? "open" : ""}`}>
                                        <div className="px-6 text-snug-muted text-[15px] leading-relaxed">
                                            {item.a}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 8. CTA Final */}
                <section className="py-24 px-6 bg-snug-bg relative" id="cta">
                    <div className="max-w-4xl mx-auto bg-snug-text rounded-[3rem] p-12 md:p-16 text-center relative overflow-hidden fade-up shadow-float">
                        <div className="absolute inset-0 bg-snug-sage opacity-10 blur-3xl rounded-full"></div>

                        <h2 className="text-3xl md:text-5xl font-serif font-medium mb-6 text-white relative z-10 leading-tight">
                            Recupere 40 horas do <br />seu mês ainda hoje.
                        </h2>

                        <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto relative z-10 font-light">
                            Junte-se a centenas de médicos que já eliminaram a burocracia clínica. O teste é gratuito e não exige cartão de crédito.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto relative z-10">
                            <Link
                                href="/register"
                                className="bg-snug-sage text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-snug-sage-hover transition-colors shadow-md w-full sm:w-auto"
                            >
                                Criar Conta Grátis
                            </Link>
                        </div>

                        <div className="flex justify-center gap-6 mt-8 relative z-10">
                            <span className="flex items-center gap-2 text-white/60 text-sm font-semibold"><Zap className="w-4 h-4" /> Setup em 30s</span>
                            <span className="flex items-center gap-2 text-white/60 text-sm font-semibold"><Lock className="w-4 h-4" /> Seguro e Privado</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* 9. Footer */}
            <footer className="bg-white py-12 px-6 border-t border-snug-sand">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 text-snug-sage">
                        <Mic className="w-5 h-5" />
                        <span className="font-serif text-xl font-bold text-snug-text">Steto</span>
                    </Link>

                    <div className="flex gap-8 text-sm font-bold text-snug-muted">
                        <a href="#como-funciona" className="hover:text-snug-sage transition-colors">Produto</a>
                        <a href="#faq" className="hover:text-snug-sage transition-colors">Privacidade (RGPD)</a>
                        <a href="mailto:suporte@steto.pt" className="hover:text-snug-sage transition-colors">Suporte</a>
                    </div>

                    <p className="text-sm font-bold text-snug-muted/50">
                        &copy; 2026 Steto.
                    </p>
                </div>
            </footer>

            {/* 10. Sticky CTA Bar */}
            <div
                id="sticky-cta"
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white/95 backdrop-blur-md border border-snug-sand rounded-2xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.1)] transition-all duration-500 z-50 flex items-center justify-between ${isStickyCtaVisible ? "translate-y-0 opacity-100" : "translate-y-[200%] opacity-0"
                    }`}
            >
                <div className="pl-3 hidden sm:block">
                    <p className="text-sm font-bold text-snug-text">Cansado de digitar?</p>
                    <p className="text-xs font-semibold text-snug-muted">Comece a poupar 2h por dia hoje.</p>
                </div>
                <Link
                    href="/register"
                    className="w-full sm:w-auto text-center bg-snug-sage text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-snug-sage-hover transition-colors"
                >
                    Testar Gratuitamente
                </Link>
            </div>
        </div>
    );
}
