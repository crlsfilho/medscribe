import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Download, CheckCircle2, ShieldCheck } from "lucide-react";

export function SignatureHelp() {
    return (
        <div className="space-y-6 py-4">
            <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                    <ShieldCheck className="w-5 h-5" />
                    <h3>Requisitos para Assinatura Médica</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Para a emissão de documentos médicos, a assinatura digital deve ser gerada por meio de certificados e chaves emitidos pela <strong>Infraestrutura de Chaves Públicas Brasileiras – ICP-Brasil</strong> e deve ser de <strong>Pessoa Física</strong>.
                </p>
            </section>

            <section className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 font-medium text-primary">
                    <ShieldCheck className="w-5 h-5" />
                    <h4 className="text-sm">Opção 1: Certificado Gratuito do CFM</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Este certificado é gratuito para médicos e fica armazenado na nuvem.
                    A autorização é feita diretamente no seu celular através do aplicativo <strong>Vidaas</strong> (da certificadora Valid).
                    Não exige tokens físicos ou instalação de drivers complexos.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2 h-10 border-primary/30 hover:bg-primary/5">
                        <a href="https://portal.cfm.org.br/servicos/certificado-digital/" target="_blank" rel="noopener noreferrer">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Como emitir meu certificado CFM</span>
                        </a>
                    </Button>
                </div>
            </section>

            <section className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 font-medium">
                    <Info className="w-5 h-5 text-blue-500" />
                    <h4 className="text-sm">Opção 2: Certificado Privado (A1 ou A3)</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                    Se você comprou um certificado por conta própria (como Certisign, Soluti, etc), ele pode ser do tipo arquivo (A1) ou Token/Cartão (A3).
                    Para estes casos, nossa plataforma utiliza a integração <strong>Certillion</strong>.
                </p>

                <div className="flex flex-col gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2 h-10">
                        <a href="https://download.certillion.com" target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 text-primary" />
                            <span>Baixar Agente Certillion (Apenas para Opção 2)</span>
                        </a>
                    </Button>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2 font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <h4 className="text-sm">Integração Certillion</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                    Nossa plataforma utiliza o <strong>Certillion</strong> para processar a assinatura.
                </p>

                <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full justify-start gap-2 h-12">
                        <a href="https://download.certillion.com" target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 text-primary" />
                            <span>Baixar Agente Certillion (Necessário para A1/A3)</span>
                        </a>
                    </Button>
                </div>
            </section>

            <div className="flex gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800">
                    Após a instalação, recarregue esta página para que o sistema identifique seu certificado.
                </p>
            </div>
        </div>
    );
}
