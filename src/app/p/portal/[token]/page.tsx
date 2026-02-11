"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientPortal({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [token]);

    async function fetchData() {
        try {
            const res = await fetch(`/api/public/portal?token=${token}`);
            if (!res.ok) throw new Error("Acesso invalido");
            const data = await res.json();
            setPatient(data);
        } catch (error) {
            // toast.error("Erro ao carregar portal");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0]) return;
        setUploading(true);

        const formData = new FormData();
        formData.append("file", e.target.files[0]);
        formData.append("token", token);

        try {
            const res = await fetch("/api/public/portal/upload", {
                method: "POST",
                body: formData
            });
            if (!res.ok) throw new Error("Falha no upload");
            toast.success("Exame enviado com sucesso!");
            fetchData(); // Refresh to show new upload
        } catch (error) {
            toast.error("Erro ao enviar arquivo.");
        } finally {
            setUploading(false);
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando seus dados...</div>;
    if (!patient) return <div className="p-8 text-center text-red-500">Link invalido ou expirado.</div>;

    const lastVisit = patient.visits[0];

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="font-semibold text-gray-900 leading-tight">{patient.name}</h1>
                            <p className="text-xs text-gray-500">Portal do Paciente</p>
                        </div>
                    </div>
                    {/* Upload Button Mobile */}
                    <div className="relative">
                        <input
                            type="file"
                            id="upload-mobile"
                            className="hidden"
                            accept=".pdf,.jpg,.png,.jpeg"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <label htmlFor="upload-mobile" className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2">
                            {uploading ? "Enviando..." : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Enviar Exame
                                </>
                            )}
                        </label>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

                {/* Last Visit Summary Highlight */}
                {lastVisit && lastVisit.laymanSummary && (
                    <Card className="border-blue-100 bg-blue-50/50">
                        <CardHeader>
                            <CardTitle className="text-lg text-blue-900">Resumo da Última Consulta</CardTitle>
                            <CardDescription className="text-blue-700">
                                {format(new Date(lastVisit.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="prose prose-blue max-w-none text-gray-700">
                            <p>{lastVisit.laymanSummary}</p>
                        </CardContent>
                    </Card>
                )}

                <Tabs defaultValue="care-plan" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="care-plan">Meu Tratamento</TabsTrigger>
                        <TabsTrigger value="documents">Documentos</TabsTrigger>
                        <TabsTrigger value="history">Histórico</TabsTrigger>
                    </TabsList>

                    {/* TRATAMENTO */}
                    <TabsContent value="care-plan" className="space-y-4">
                        {lastVisit?.carePlan ? (
                            <div className="grid gap-4">
                                {JSON.parse(lastVisit.carePlan).map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border shadow-sm flex items-start gap-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-600">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-lg">{item.medication || item.name}</h3>
                                            <p className="text-gray-600">{item.instructions}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">Nenhum medicamento ativo registrado.</div>
                        )}
                    </TabsContent>

                    {/* DOCUMENTOS */}
                    <TabsContent value="documents" className="space-y-4">
                        {/* List uploaded files + Generated docs */}
                        {lastVisit?.actionableItems?.filter((i: any) => i.status === 'completed').map((item: any) => {
                            const meta = JSON.parse(item.metadata || "{}");
                            return (
                                <div key={item.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{meta.filename || item.type}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(item.completedAt || item.createdAt), "dd/MM/yyyy")}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={meta.url} target="_blank" rel="noreferrer">Baixar</a>
                                    </Button>
                                </div>
                            );
                        })}
                        {(!lastVisit?.actionableItems || lastVisit.actionableItems.length === 0) && (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                                <p className="text-gray-500 mb-4">Nenhum documento encontrado.</p>
                                <label className="cursor-pointer text-blue-600 hover:underline">
                                    Clique aqui para enviar um exame
                                    <input type="file" className="hidden" onChange={handleUpload} />
                                </label>
                            </div>
                        )}
                    </TabsContent>

                    {/* HISTORICO */}
                    <TabsContent value="history" className="space-y-4">
                        {patient.visits.map((visit: any) => (
                            <div key={visit.id} className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">Consulta Médica</h3>
                                        <p className="text-sm text-gray-500">{format(new Date(visit.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                                    </div>
                                    <Badge variant="outline">Concluída</Badge>
                                </div>
                            </div>
                        ))}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
