import { api } from "@/lib/axios";
import {
  TrainingAttendance,
  TrainingEventFile,
  TrainingFilePreview,
  TrainingInvitation,
  TrainingSurveyAnswers,
} from "@/types/training";
import CryptoJS from "crypto-js";
import { Platform } from "react-native";

interface ApiEnvelope<T> {
  Succeeded?: boolean;
  Message?: string | null;
  Errors?: string[] | null;
  Data?: T | null;
}

interface RawInvitation {
  TnpID?: number | null;
  TneID?: number | null;
  TneName?: string | null;
  TneEventTypeName?: string | null;
  TnpRegistrationStatus?: number | null;
  TnpConfirmedAt?: string | null;
  TnpDeclineReason?: string | null;
  TnpDeclineComment?: string | null;
  TneStartDate?: string | null;
  TneEndDate?: string | null;
  TneConfirmationDeadline?: string | null;
  TneFlyerFilID?: number | null;
  TsiInstructorName?: string | null;
  TneLocation?: string | null;
  TneVirtualLink?: string | null;
  TnpHasSurvey?: boolean | null;
  TnpCertificateFilID?: number | null;
  TnsID?: number | null;
  TnsTopicName?: string | null;
  TnsStartDateTime?: string | null;
  TnsEndDateTime?: string | null;
}

function readEnvelope<T>(raw: unknown, fallbackMessage: string): T {
  const envelope = (raw ?? {}) as ApiEnvelope<T>;
  if (envelope.Succeeded === false) {
    throw new Error(envelope.Message || fallbackMessage);
  }
  return envelope.Data as T;
}

export function extractApiError(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "isAxiosError" in error) {
    const axiosError = error as {
      isAxiosError: boolean;
      message?: string;
      code?: string;
      response?: { data?: ApiEnvelope<unknown> | string };
    };
    const data = axiosError.response?.data;
    if (data && typeof data === "object" && "Message" in data) {
      const message = (data as ApiEnvelope<unknown>).Message;
      if (message) return message;
    }
    if (axiosError.code === "ERR_NETWORK") {
      return "Sin conexión con el servidor. Verifica tu internet e inténtalo otra vez.";
    }
    return axiosError.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  return false;
}

function normalizeInvitation(row: RawInvitation): TrainingInvitation {
  return {
    TnpID: toNumberOrNull(row.TnpID) ?? 0,
    TneID: toNumberOrNull(row.TneID) ?? 0,
    TneName: toStringOrNull(row.TneName) ?? "Capacitación",
    TneEventTypeName: toStringOrNull(row.TneEventTypeName),
    TnpRegistrationStatus: toNumberOrNull(row.TnpRegistrationStatus) ?? 0,
    TnpConfirmedAt: toStringOrNull(row.TnpConfirmedAt),
    TnpDeclineReason: toStringOrNull(row.TnpDeclineReason),
    TnpDeclineComment: toStringOrNull(row.TnpDeclineComment),
    TneStartDate: toStringOrNull(row.TneStartDate),
    TneEndDate: toStringOrNull(row.TneEndDate),
    TneConfirmationDeadline: toStringOrNull(row.TneConfirmationDeadline),
    TneFlyerFilID: toNumberOrNull(row.TneFlyerFilID),
    TsiInstructorName: toStringOrNull(row.TsiInstructorName),
    TneLocation: toStringOrNull(row.TneLocation),
    TneVirtualLink: toStringOrNull(row.TneVirtualLink),
    TnpHasSurvey: toBoolean(row.TnpHasSurvey),
    TnpCertificateFilID: toNumberOrNull(row.TnpCertificateFilID),
    sessions: [],
  };
}

function groupInvitations(rows: RawInvitation[]): TrainingInvitation[] {
  const grouped = new Map<number, TrainingInvitation>();

  for (const row of rows) {
    const invitation = normalizeInvitation(row);
    if (!invitation.TnpID) continue;

    const current = grouped.get(invitation.TnpID);
    if (!current) {
      grouped.set(invitation.TnpID, {
        ...invitation,
        sessions: [],
      });
      continue;
    }

    if (current.TneFlyerFilID === null) {
      current.TneFlyerFilID = invitation.TneFlyerFilID;
    }
    if (current.TneConfirmationDeadline === null) {
      current.TneConfirmationDeadline = invitation.TneConfirmationDeadline;
    }
    if (current.TnpCertificateFilID === null) {
      current.TnpCertificateFilID = invitation.TnpCertificateFilID;
    }
    if (current.TneVirtualLink === null) {
      current.TneVirtualLink = invitation.TneVirtualLink;
    }
  }

  for (const row of rows) {
    const invitation = grouped.get(toNumberOrNull(row.TnpID) ?? 0);
    const sessionId = toNumberOrNull(row.TnsID);
    if (!invitation || sessionId === null) continue;
    if (invitation.sessions.some((session) => session.TnsID === sessionId)) continue;

    invitation.sessions.push({
      TnsID: sessionId,
      TnsTopicName: toStringOrNull(row.TnsTopicName),
      TnsStartDateTime: toStringOrNull(row.TnsStartDateTime),
      TnsEndDateTime: toStringOrNull(row.TnsEndDateTime),
      TsiInstructorName: toStringOrNull(row.TsiInstructorName),
    });
  }

  const invitations = Array.from(grouped.values());
  for (const invitation of invitations) {
    invitation.sessions.sort((a, b) => {
      const left = a.TnsStartDateTime ? new Date(a.TnsStartDateTime).getTime() : 0;
      const right = b.TnsStartDateTime ? new Date(b.TnsStartDateTime).getTime() : 0;
      return left - right;
    });
  }
  return invitations;
}

function normalizeAttendance(row: Record<string, unknown>): TrainingAttendance {
  return {
    TnaID: toNumberOrNull(row.TnaID) ?? 0,
    TnsID: toNumberOrNull(row.TnsID) ?? 0,
    TnpID: toNumberOrNull(row.TnpID) ?? 0,
    TnaAttended: toBoolean(row.TnaAttended),
    TnaCheckInAt: toStringOrNull(row.TnaCheckInAt),
    TnaNotes: toStringOrNull(row.TnaNotes),
    TneName: toStringOrNull(row.TneName) ?? "Capacitación",
    TnsStartDateTime: toStringOrNull(row.TnsStartDateTime),
    TnsEndDateTime: toStringOrNull(row.TnsEndDateTime),
    TnpPersonName: toStringOrNull(row.TnpPersonName),
    TneFlyerFilID: toNumberOrNull(row.TneFlyerFilID),
    TsiInstructorName: toStringOrNull(row.TsiInstructorName),
    TneLocation: toStringOrNull(row.TneLocation),
  };
}

function normalizeEventFile(row: Record<string, unknown>): TrainingEventFile {
  return {
    TefID: toNumberOrNull(row.TefID) ?? 0,
    TneID: toNumberOrNull(row.TneID) ?? 0,
    FilID: toNumberOrNull(row.FilID) ?? 0,
    TefIsFlyer: toBoolean(row.TefIsFlyer),
    TefFileName: toStringOrNull(row.TefFileName),
  };
}

const MAX_PREVIEW_BYTES = 30 * 1024 * 1024;

function toBase64(bytes: Uint8Array): string {
  const words: number[] = [];
  for (let offset = 0; offset < bytes.length; offset += 4) {
    words.push(
      ((bytes[offset] ?? 0) << 24) |
        ((bytes[offset + 1] ?? 0) << 16) |
        ((bytes[offset + 2] ?? 0) << 8) |
        (bytes[offset + 3] ?? 0),
    );
  }
  return CryptoJS.enc.Base64.stringify(
    CryptoJS.lib.WordArray.create(words, bytes.length),
  );
}

function resolveMimeType(contentType?: string | null): string {
  if (!contentType) return "application/octet-stream";
  const mime = contentType.split(";")[0].trim().toLowerCase();
  return mime.length > 0 ? mime : "application/octet-stream";
}

export const trainingService = {
  async getInvitations(): Promise<TrainingInvitation[]> {
    const { data } = await api.get("/MpwTrainingParticipant/Mine");
    const rows =
      readEnvelope<RawInvitation[] | null>(
        data,
        "No se pudieron cargar las capacitaciones."
      ) ?? [];
    return groupInvitations(rows);
  },

  async getPendingAttendances(): Promise<TrainingAttendance[]> {
    const { data } = await api.get("/MpwTrainingAttendance/Mine");
    const rows =
      readEnvelope<Record<string, unknown>[] | null>(
        data,
        "No se pudieron cargar las asistencias."
      ) ?? [];
    return rows.map(normalizeAttendance);
  },

  async confirmInvitation(tnpID: number): Promise<boolean> {
    const { data } = await api.post(`/MpwTrainingParticipant/Confirm/${tnpID}`);
    return readEnvelope<boolean>(data, "No se pudo confirmar la asistencia.") === true;
  },

  async declineInvitation(
    tnpID: number,
    reason: string,
    comment?: string | null
  ): Promise<boolean> {
    const { data } = await api.post(`/MpwTrainingParticipant/Decline/${tnpID}`, {
      Reason: reason,
      Comment: comment && comment.trim().length > 0 ? comment.trim() : null,
    });
    return readEnvelope<boolean>(data, "No se pudo registrar el rechazo.") === true;
  },

  async confirmAttendance(tnaID: number): Promise<boolean> {
    const { data } = await api.post(`/MpwTrainingAttendance/Confirm/${tnaID}`);
    return readEnvelope<boolean>(data, "No se pudo registrar la asistencia.") === true;
  },

  async getEventFiles(eventId: number): Promise<TrainingEventFile[]> {
    const { data } = await api.get(
      `/MpwTrainingEventFile/ForPerson/${eventId}`
    );
    const rows =
      readEnvelope<Record<string, unknown>[] | null>(
        data,
        "No se pudieron cargar los materiales."
      ) ?? [];
    return rows.map(normalizeEventFile);
  },

  async submitSurvey(answers: TrainingSurveyAnswers): Promise<void> {
    const { data } = await api.post("/MpwTrainingSurvey/Submit", {
      TnpID: answers.TnpID,
      TnvObjectivesMet: answers.TnvObjectivesMet,
      TnvExamplesWereUseful: answers.TnvExamplesWereUseful,
      TnvTopicsWereCovered: answers.TnvTopicsWereCovered,
      TnvUsefulForWork: answers.TnvUsefulForWork,
      TnvTimeWasSufficient: answers.TnvTimeWasSufficient,
      TnvComments:
        answers.TnvComments && answers.TnvComments.trim().length > 0
          ? answers.TnvComments.trim()
          : null,
    });
    readEnvelope<unknown>(data, "No se pudo enviar la encuesta.");
  },

  async getFilePreview(fileId: number): Promise<TrainingFilePreview> {
    const response = await api.get(`/GenFiles/${fileId}/preview`, {
      responseType: Platform.OS === "web" ? "blob" : "arraybuffer",
    });

    const mimeType = resolveMimeType(
      (response.headers?.["content-type"] as string | undefined) ?? null
    );
    const isImage = mimeType.startsWith("image/");

    if (Platform.OS === "web") {
      const blob = response.data as Blob;
      const uri = URL.createObjectURL(blob);
      return { uri, mimeType, isImage };
    }

    const buffer = response.data as ArrayBuffer;
    const bytes = new Uint8Array(buffer);
    if (bytes.length > MAX_PREVIEW_BYTES) {
      throw new Error("El archivo es demasiado grande para la vista previa.");
    }
    const base64 = toBase64(bytes);
    const uri = `data:${mimeType};base64,${base64}`;
    return { uri, mimeType, isImage };
  },
};
