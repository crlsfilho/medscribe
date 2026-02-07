"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import type { Appointment } from "./calendar";

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  appointment: Appointment | null;
  defaultDate: Date | null;
}

export function AppointmentModal({
  open,
  onClose,
  onSaved,
  onDeleted,
  appointment,
  defaultDate,
}: AppointmentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("scheduled");

  const isEditing = !!appointment;

  useEffect(() => {
    if (appointment) {
      setPatientName(appointment.patientName);
      setPatientAge(appointment.patientAge?.toString() || "");
      setPatientSex(appointment.patientSex || "");
      setNotes(appointment.notes || "");
      setDuration(appointment.duration.toString());
      setStatus(appointment.status);

      const scheduledDate = new Date(appointment.scheduledAt);
      setDate(scheduledDate.toISOString().split("T")[0]);
      setTime(
        scheduledDate.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    } else if (defaultDate) {
      setPatientName("");
      setPatientAge("");
      setPatientSex("");
      setNotes("");
      setDuration("30");
      setStatus("scheduled");
      setDate(defaultDate.toISOString().split("T")[0]);
      setTime("09:00");
    }
    setError("");
  }, [appointment, defaultDate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const scheduledAt = new Date(`${date}T${time}:00`);

      const body = {
        patientName,
        patientAge: patientAge || null,
        patientSex: patientSex || null,
        scheduledAt: scheduledAt.toISOString(),
        duration: parseInt(duration),
        notes: notes || null,
        status,
      };

      const url = isEditing
        ? `/api/appointments/${appointment.id}`
        : "/api/appointments";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar agendamento");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;

    if (!confirm("Tem certeza que deseja excluir este agendamento?")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir agendamento");
      }

      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  };

  const handleStartConsultation = () => {
    // Navigate to new consultation with pre-filled patient data
    const params = new URLSearchParams({
      name: patientName,
      age: patientAge || "",
      sex: patientSex || "",
      appointmentId: appointment?.id || "",
    });
    router.push(`/consulta/nova?${params.toString()}`);
    onClose();
  };

  const formatDateDisplay = () => {
    if (!date) return "";
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            {isEditing ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
          <DialogDescription>
            {formatDateDisplay() || "Selecione uma data para o agendamento"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Patient Name */}
          <div className="space-y-2">
            <Label htmlFor="patientName">Nome do Paciente</Label>
            <Input
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nome completo"
              className="h-11 rounded-xl"
              required
            />
          </div>

          {/* Age and Sex */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="patientAge">
                Idade{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                id="patientAge"
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Ex: 45"
                className="h-11 rounded-xl"
                min="0"
                max="150"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientSex">
                Sexo{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Select value={patientSex} onValueChange={setPatientSex}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="O">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horario</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duracao</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1h 30min</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status (only when editing) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="completed">Realizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Observacoes{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da consulta, informacoes adicionais..."
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || deleting}
                className="rounded-xl"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>
            )}

            <div className="flex-1" />

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={loading} className="rounded-xl">
              {loading ? "Salvando..." : isEditing ? "Salvar" : "Agendar"}
            </Button>
          </div>

          {/* Start Consultation Button (when editing scheduled appointment) */}
          {isEditing && status === "scheduled" && (
            <div className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleStartConsultation}
                className="w-full rounded-xl gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                  />
                </svg>
                Iniciar Atendimento Agora
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
