import { api } from "@/lib/axios";
import { logger } from "@/lib/logger";

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
      logger.error("Error guardando el token de notificaciones:", error);
      return false;
    }
  },
};
