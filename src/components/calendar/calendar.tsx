"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AppointmentModal } from "./appointment-modal";

export interface Appointment {
  id: string;
  patientName: string;
  patientAge: number | null;
  patientSex: string | null;
  scheduledAt: string;
  duration: number;
  notes: string | null;
  status: string;
  visitId: string | null;
}

type ViewMode = "week" | "month";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const WEEKDAYS_FULL = [
  "Domingo",
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day;
  const weekStart = new Date(date);
  weekStart.setDate(diff);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  return days;
}

function getMonthDays(date: Date): (Date | null)[][] {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Add padding for days before the first of the month
  for (let i = 0; i < startPadding; i++) {
    currentWeek.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    currentWeek.push(new Date(year, month, day));

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add padding for remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Calendar() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      if (viewMode === "week") {
        const weekDays = getWeekDays(currentDate);
        startDate = weekDays[0];
        endDate = weekDays[6];
      } else {
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
      }

      // Set time to start/end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const response = await fetch(
        `/api/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getAppointmentsForDay = (date: Date): Appointment[] => {
    return appointments.filter((apt) =>
      isSameDay(new Date(apt.scheduledAt), date)
    );
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedAppointment(null);
    setModalOpen(true);
  };

  const handleAppointmentClick = (
    e: React.MouseEvent,
    appointment: Appointment
  ) => {
    e.stopPropagation();
    setSelectedAppointment(appointment);
    setSelectedDate(new Date(appointment.scheduledAt));
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
    setSelectedDate(null);
  };

  const handleAppointmentSaved = () => {
    fetchAppointments();
    handleModalClose();
  };

  const handleAppointmentDeleted = () => {
    fetchAppointments();
    handleModalClose();
  };

  const today = new Date();
  const weekDays = getWeekDays(currentDate);
  const monthWeeks = getMonthDays(currentDate);

  const getHeaderText = () => {
    if (viewMode === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} de ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
      }
      return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} - ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
    }
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  return (
    <div className="medical-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Agenda</h2>
            <span className="text-sm text-muted-foreground">
              {getHeaderText()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "week"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "month"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mes
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={navigatePrevious}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
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
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={navigateNext}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
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
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "week" ? (
        // Week View
        <div className="grid grid-cols-7 divide-x divide-border/50">
          {weekDays.map((date, index) => {
            const isToday = isSameDay(date, today);
            const dayAppointments = getAppointmentsForDay(date);

            return (
              <div
                key={index}
                onClick={() => handleDayClick(date)}
                className="min-h-[180px] cursor-pointer hover:bg-muted/30 transition-colors"
              >
                {/* Day Header */}
                <div
                  className={`p-3 text-center border-b border-border/50 ${isToday ? "bg-primary/5" : ""}`}
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {WEEKDAYS[index]}
                  </p>
                  <p
                    className={`text-lg font-semibold mt-1 ${
                      isToday
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {date.getDate()}
                  </p>
                </div>

                {/* Appointments */}
                <div className="p-2 space-y-1.5">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <button
                      key={apt.id}
                      onClick={(e) => handleAppointmentClick(e, apt)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                        apt.status === "cancelled"
                          ? "bg-muted/50 text-muted-foreground line-through"
                          : apt.status === "completed"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent hover:bg-accent/80 text-accent-foreground"
                      }`}
                    >
                      <p className="font-medium truncate">{apt.patientName}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {formatTime(apt.scheduledAt)}
                      </p>
                    </button>
                  ))}
                  {dayAppointments.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{dayAppointments.length - 3} mais
                    </p>
                  )}
                  {dayAppointments.length === 0 && (
                    <div className="flex items-center justify-center py-4 opacity-0 hover:opacity-100 transition-opacity">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Month View
        <div>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border/50">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Grid */}
          <div className="divide-y divide-border/50">
            {monthWeeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="grid grid-cols-7 divide-x divide-border/50"
              >
                {week.map((date, dayIndex) => {
                  if (!date) {
                    return (
                      <div
                        key={dayIndex}
                        className="min-h-[100px] bg-muted/20"
                      />
                    );
                  }

                  const isToday = isSameDay(date, today);
                  const dayAppointments = getAppointmentsForDay(date);

                  return (
                    <div
                      key={dayIndex}
                      onClick={() => handleDayClick(date)}
                      className={`min-h-[100px] cursor-pointer hover:bg-muted/30 transition-colors ${
                        isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="p-2">
                        <p
                          className={`text-sm font-medium ${
                            isToday
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          {date.getDate()}
                        </p>

                        {/* Appointments */}
                        <div className="mt-1 space-y-1">
                          {dayAppointments.slice(0, 2).map((apt) => (
                            <button
                              key={apt.id}
                              onClick={(e) => handleAppointmentClick(e, apt)}
                              className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors ${
                                apt.status === "cancelled"
                                  ? "bg-muted/50 text-muted-foreground line-through"
                                  : apt.status === "completed"
                                    ? "bg-primary/20 text-primary"
                                    : "bg-accent text-accent-foreground hover:bg-accent/80"
                              }`}
                            >
                              {formatTime(apt.scheduledAt)} {apt.patientName}
                            </button>
                          ))}
                          {dayAppointments.length > 2 && (
                            <p className="text-xs text-muted-foreground px-1.5">
                              +{dayAppointments.length - 2}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Button */}
      <div className="p-4 border-t border-border/50 bg-muted/20">
        <Button
          onClick={() => {
            setSelectedDate(new Date());
            setSelectedAppointment(null);
            setModalOpen(true);
          }}
          className="w-full rounded-xl gap-2"
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Agendar Consulta
        </Button>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        open={modalOpen}
        onClose={handleModalClose}
        onSaved={handleAppointmentSaved}
        onDeleted={handleAppointmentDeleted}
        appointment={selectedAppointment}
        defaultDate={selectedDate}
      />
    </div>
  );
}
