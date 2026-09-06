import { api } from "@/lib/axios";

export type TrainingAttendance = {
  TnpID: number;
  TneName: string;
  TneEventTypeName: string;
  TnsStartDateTime: string;
  TnsEndDateTime: string;
  TneFlyerFilID?: number | null;
  TnsTopicName: string;
  TsiInstructorName?: string | null;
  TneLocation?: string | null;
};

export const trainingAttendanceService = {
  async getPending(): Promise<TrainingAttendance[]> {
    const { data } = await api.get("/MpwTrainingParticipant/Mine");
    return data?.Data ?? [];
  },

  async confirm(participantId: number): Promise<boolean> {
    const { data } = await api.post(
      `/MpwTrainingParticipant/Confirm/${participantId}`,
    );
    return data?.Data === true || data?.Succeeded === true;
  },
};
