"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Patient {
    id: string;
    name: string;
    age: number | null;
    sex: string | null;
    createdAt: string;
    _count?: {
        visits: number;
    };
}

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // New Patient Form State
    const [newName, setNewName] = useState("");
    const [newAge, setNewAge] = useState("");
    const [newSex, setNewSex] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await fetch("/api/patients");
            if (response.ok) {
                const data = await response.json();
                setPatients(data);
            }
        } catch (error) {
            console.error("Erro ao carregar pacientes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const response = await fetch("/api/patients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    age: newAge ? parseInt(newAge) : null,
                    sex: newSex || null,
                }),
            });

            if (response.ok) {
                const newPatient = await response.json();
                setPatients([newPatient, ...patients]);
                setIsCreateOpen(false);
                setNewName("");
                setNewAge("");
                setNewSex("");
            }
        } catch (error) {
            console.error("Erro ao criar paciente:", error);
        } finally {
            setCreating(false);
        }
    };

    const handleDeletePatient = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja apagar ${name}? Todas as consultas deste paciente também serão apagadas.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/patients/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setPatients(patients.filter((p) => p.id !== id));
            } else {
                alert("Erro ao apagar paciente");
            }
        } catch (error) {
            console.error("Erro ao apagar:", error);
        }
    };

    const filteredPatients = patients.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Pacientes</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie seus pacientes e histórico
                    </p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="gap-2 rounded-xl">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Novo Paciente
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Adicionar Paciente</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreatePatient} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ex: Maria Silva"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="age">Idade</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        value={newAge}
                                        onChange={(e) => setNewAge(e.target.value)}
                                        placeholder="Ex: 45"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sex">Sexo Biológico</Label>
                                    <Input
                                        id="sex"
                                        value={newSex}
                                        onChange={(e) => setNewSex(e.target.value)}
                                        placeholder="Ex: F ou M"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating} className="w-full">
                                    {creating ? "Criando..." : "Salvar Paciente"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                        />
                    </svg>
                    <Input
                        placeholder="Buscar por nome..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/20 transition-all"
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="medical-card p-12 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="medical-card p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="font-medium text-foreground mb-2">
                        Nenhum paciente encontrado
                    </h3>
                    <p className="text-muted-foreground">
                        Cadastre seu primeiro paciente para começar
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredPatients.map((patient) => (
                        <div
                            key={patient.id}
                            className="medical-card p-5 hover:shadow-md transition-all group relative"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                                        {patient.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">
                                            {patient.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {patient.age ? `${patient.age} anos` : "Idade não inf."} •{" "}
                                            {patient.sex || "Sexo não inf."}
                                        </p>
                                    </div>
                                </div>
                                {/* Delete Button (Visible on Hover/Focus) */}
                                <button
                                    onClick={() => handleDeletePatient(patient.id, patient.name)}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Apagar Paciente"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                                <span className="text-xs text-muted-foreground">
                                    {/* Fallback if _count is missing */}
                                    {patient._count?.visits || 0} consultas registradas
                                </span>
                                <Link href={`/pacientes/${patient.id}`}>
                                    <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/5 hover:text-primary">
                                        Ver Prontuário
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
