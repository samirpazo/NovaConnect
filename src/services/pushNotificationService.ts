import { api } from "@/lib/axios";

export const pushNotificationService = {
  async saveToken(prsId: number, token: string): Promise<boolean> {
    try {
      const payload = {
        PrsID: prsId,
        PnoPushToken: token,
      };
      
      const { data } = await api.post("/GenPushNotification/Save", payload);
      return data.Succeeded || data.Data;
    } catch (error) {
      console.error("Error guardando el token de notificaciones:", error);
      return false;
    }
  },
};
