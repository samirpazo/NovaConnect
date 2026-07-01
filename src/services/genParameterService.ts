import { api } from "@/lib/axios";
import { logger } from "@/lib/logger";

export type HelpData = {
  emails: string[];
  phones: string[];
};

export const genParameterService = {
  async getHelpInfo(): Promise<HelpData | null> {
    try {
      const { data } = await api.get("/GenParameter/GetHelpInfo");
      // Soporta tanto si el backend responde { Data: ... } como { data: ... }
      const payload = data?.Data || data?.data;

      if (payload) {
        // Si el valor llega como string desde el backend, lo parseamos a JSON
        const parsedData =
          typeof payload === "string" ? JSON.parse(payload) : payload;

        // Extraemos dinámicamente los valores (email_1, email_2, etc.)
        const emails: string[] = [];
        if (Array.isArray(parsedData.emails)) {
          parsedData.emails.forEach((e: any) => {
            emails.push(...(Object.values(e) as string[]));
          });
        }

        const phones: string[] = [];
        if (Array.isArray(parsedData.phones)) {
          parsedData.phones.forEach((p: any) => {
            phones.push(...(Object.values(p) as string[]));
          });
        }

        return { emails, phones };
      }
      return null;
    } catch (error) {
      logger.error("Error fetching help data:", error);
      return null;
    }
  },
};
