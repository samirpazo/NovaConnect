export const TRAINING_STATUS = {
  PENDING: 1,
  CONFIRMED: 2,
  DECLINED: 3,
  CANCELLED: 4,
} as const;

export type TrainingStatus = (typeof TRAINING_STATUS)[keyof typeof TRAINING_STATUS];

export interface TrainingSession {
  TnsID: number | null;
  TnsTopicName: string | null;
  TnsStartDateTime: string | null;
  TnsEndDateTime: string | null;
  TsiInstructorName: string | null;
}

export interface TrainingInvitation {
  TnpID: number;
  TneID: number;
  TneName: string;
  TneEventTypeName: string | null;
  TnpRegistrationStatus: number;
  TnpConfirmedAt: string | null;
  TnpDeclineReason: string | null;
  TnpDeclineComment: string | null;
  TneStartDate: string | null;
  TneEndDate: string | null;
  TneConfirmationDeadline: string | null;
  TneFlyerFilID: number | null;
  TsiInstructorName: string | null;
  TneLocation: string | null;
  TneVirtualLink: string | null;
  TnpHasSurvey: boolean;
  TnpCertificateFilID: number | null;
  sessions: TrainingSession[];
}

export interface TrainingAttendance {
  TnaID: number;
  TnsID: number;
  TnpID: number;
  TnaAttended: boolean;
  TnaCheckInAt: string | null;
  TnaNotes: string | null;
  TneName: string;
  TnsStartDateTime: string | null;
  TnsEndDateTime: string | null;
  TnpPersonName: string | null;
  TneFlyerFilID: number | null;
  TsiInstructorName: string | null;
  TneLocation: string | null;
}

export interface TrainingEventFile {
  TefID: number;
  TneID: number;
  FilID: number;
  TefIsFlyer: boolean;
  TefFileName: string | null;
}

export interface TrainingSurveyAnswers {
  TnpID: number;
  TnvObjectivesMet: boolean;
  TnvExamplesWereUseful: boolean;
  TnvTopicsWereCovered: boolean;
  TnvUsefulForWork: boolean;
  TnvTimeWasSufficient: boolean;
  TnvComments: string | null;
}

export interface TrainingFilePreview {
  uri: string;
  mimeType: string;
  isImage: boolean;
}

export type TrainingSegment = "invitations" | "upcoming" | "history";
