import {
  TRAINING_STATUS,
  TrainingInvitation,
  TrainingSession,
  TrainingStatus,
} from "@/types/training";

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export const EMPTY_VALUE = "—";

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function fallbackDate(date: Date): string {
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function fallbackTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDate(value?: string | null): string {
  const date = toDate(value);
  if (!date) return EMPTY_VALUE;
  try {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return fallbackDate(date);
  }
}

export function formatTime(value?: string | null): string {
  const date = toDate(value);
  if (!date) return EMPTY_VALUE;
  try {
    return new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return fallbackTime(date);
  }
}

export function formatDateTime(value?: string | null): string {
  const date = toDate(value);
  if (!date) return EMPTY_VALUE;
  return `${formatDate(value)} · ${formatTime(value)}`;
}

export function formatWeekdayDateTime(value?: string | null): string {
  const date = toDate(value);
  if (!date) return EMPTY_VALUE;
  return `${WEEKDAYS[date.getDay()]}, ${formatDate(value)} ${formatTime(value)}`;
}

export function formatTimeRange(
  start?: string | null,
  end?: string | null
): string {
  const startDate = toDate(start);
  if (!startDate) return EMPTY_VALUE;
  const endDate = toDate(end);
  if (!endDate) return formatTime(start);
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function formatSession(session: TrainingSession): string {
  const start = session.TnsStartDateTime ?? null;
  const end = session.TnsEndDateTime ?? null;
  if (!start) return EMPTY_VALUE;
  return `${formatDate(start)} · ${formatTimeRange(start, end)}`;
}

export function isPast(value?: string | null): boolean {
  const date = toDate(value);
  if (!date) return false;
  return date.getTime() < Date.now();
}

export function trainingStartDate(invitation: TrainingInvitation): Date | null {
  const sessionDates = invitation.sessions
    .map((session) => toDate(session.TnsStartDateTime))
    .filter((date): date is Date => date !== null);
  if (sessionDates.length > 0) {
    return new Date(Math.min(...sessionDates.map((date) => date.getTime())));
  }
  return toDate(invitation.TneStartDate);
}

export function trainingEndDate(invitation: TrainingInvitation): Date | null {
  const sessionDates = invitation.sessions
    .map((session) => toDate(session.TnsEndDateTime ?? session.TnsStartDateTime))
    .filter((date): date is Date => date !== null);
  if (sessionDates.length > 0) {
    return new Date(Math.max(...sessionDates.map((date) => date.getTime())));
  }
  return toDate(invitation.TneEndDate ?? invitation.TneStartDate);
}

export function isTrainingFinished(invitation: TrainingInvitation): boolean {
  const end = trainingEndDate(invitation);
  if (!end) return false;
  return end.getTime() < Date.now();
}

export function isConfirmationExpired(invitation: TrainingInvitation): boolean {
  return isPast(invitation.TneConfirmationDeadline);
}

export interface TrainingStatusView {
  label: string;
  bg: string;
  text: string;
  border: string;
}

export function trainingStatusView(
  status: number,
  isDark = false
): TrainingStatusView {
  switch (status) {
    case TRAINING_STATUS.PENDING:
      return isDark
        ? {
            label: "Pendiente",
            bg: "rgba(245, 158, 11, 0.16)",
            text: "#FCD34D",
            border: "rgba(245, 158, 11, 0.45)",
          }
        : {
            label: "Pendiente",
            bg: "#FEF3C7",
            text: "#B45309",
            border: "#F59E0B",
          };
    case TRAINING_STATUS.CONFIRMED:
      return isDark
        ? {
            label: "Confirmada",
            bg: "rgba(34, 197, 94, 0.16)",
            text: "#86EFAC",
            border: "rgba(34, 197, 94, 0.45)",
          }
        : {
            label: "Confirmada",
            bg: "#DCFCE7",
            text: "#15803D",
            border: "#22C55E",
          };
    case TRAINING_STATUS.DECLINED:
      return isDark
        ? {
            label: "Declinada",
            bg: "rgba(239, 68, 68, 0.16)",
            text: "#FCA5A5",
            border: "rgba(239, 68, 68, 0.45)",
          }
        : {
            label: "Declinada",
            bg: "#FEE2E2",
            text: "#B91C1C",
            border: "#EF4444",
          };
    default:
      return isDark
        ? {
            label: "Cancelada",
            bg: "rgba(148, 163, 184, 0.16)",
            text: "#CBD5E1",
            border: "rgba(148, 163, 184, 0.4)",
          }
        : {
            label: "Cancelada",
            bg: "#F1F5F9",
            text: "#475569",
            border: "#CBD5E1",
          };
  }
}

export function trainingStatusLabel(status: TrainingStatus | number): string {
  return trainingStatusView(status).label;
}
