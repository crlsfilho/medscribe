
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowRight, Mic, FileText, Share2, Shield, Radio, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default async function LandingPage() {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-900">MedScribe</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            Entrar
                        </Link>
                        <Link href="/register">
                            <button className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                                Começar Grátis
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Agora com Portal do Paciente
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
                    Suas notas clínicas, <span className="text-blue-600">automaticamente</span>.
                </h1>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    O MedScribe escuta sua consulta e gera o prontuário SOAP, exames e documentos em segundos. Economize até 2 horas por dia.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/register">
                        <button className="h-12 px-8 rounded-full bg-blue-600 text-white font-medium text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
                            Experimentar Agora
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Sem cartão de crédito
                    </div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section className="px-4 sm:px-6 pb-24 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">

                    {/* Feature 1: Transcription (Large) */}
                    <div className="md:col-span-2 row-span-1 md:row-span-2 bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                <Mic className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Transcrição em Tempo Real</h3>
                            <p className="text-gray-600 max-w-md">
                                Nossa IA separa as falas de médico e paciente, entende termos técnicos e ignora conversas irrelevantes.
                            </p>
                        </div>
                        {/* Abstract UI representation */}
                        <div className="absolute right-0 bottom-0 w-3/4 h-3/4 bg-white rounded-tl-3xl shadow-xl border border-gray-100 p-6 transition-transform group-hover:scale-105 duration-500 ease-out">
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0" />
                                    <div className="bg-gray-50 rounded-2xl rounded-tl-none p-3 text-sm text-gray-600 w-full">
                                        O paciente relata dor abdominal há 3 dias...
                                    </div>
                                </div>
                                <div className="flex gap-3 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex-shrink-0" />
                                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 text-sm w-3/4">
                                        Certo, e a dor irradia para algum lugar?
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0" />
                                    <div className="bg-gray-50 rounded-2xl rounded-tl-none p-3 text-sm text-gray-600 w-full">
                                        Sim, para as costas.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: SOAP Generation */}
                    <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 relative overflow-hidden text-white group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                <FileText className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Notas SOAP</h3>
                            <p className="text-gray-400 text-sm">
                                Transforma a conversa em prontuário estruturado automaticamente.
                            </p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-colors"></div>
                    </div>

                    {/* Feature 3: Patient Portal */}
                    <div className="bg-blue-600 rounded-3xl p-8 border border-blue-500 relative overflow-hidden text-white md:col-span-1 md:row-span-2 group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
                                <Share2 className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Portal do Paciente</h3>
                            <p className="text-blue-100 mb-8">
                                Envie receitas, atestados e pedidos de exame com um link seguro via WhatsApp.
                            </p>

                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 transition-transform group-hover:-translate-y-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.125-.272-.199-.57-.348z" /></svg>
                                    </div>
                                    <div>
                                        <div className="h-2 w-20 bg-white/30 rounded-full mb-1"></div>
                                        <div className="h-2 w-12 bg-white/20 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="h-24 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                                    <span className="text-xs text-white/50">Visualização do Recibo</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 4: Security */}
                    <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                <Shield className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">100% Seguro</h3>
                            <p className="text-gray-600 text-sm">
                                Conformidade com LGPD e HIPAA. Seus dados são criptografados de ponta a ponta.
                            </p>
                        </div>
                    </div>

                </div>
            </section>

            {/* Trust/Social Proof */}
            <section className="py-20 bg-gray-50 border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-12">Usado por clínicos de todas as especialidades</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholders for logos */}
                        <div className="flex items-center justify-center font-bold text-xl text-gray-400">CardioClin</div>
                        <div className="flex items-center justify-center font-bold text-xl text-gray-400">NeuroLife</div>
                        <div className="flex items-center justify-center font-bold text-xl text-gray-400">Orthopedia</div>
                        <div className="flex items-center justify-center font-bold text-xl text-gray-400">Dermato+</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-12 border-t border-gray-100">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center">
                            <Mic className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">MedScribe</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        © 2026 MedScribe Inc. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
