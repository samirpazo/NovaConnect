import { api } from "@/lib/axios";
import { DinMenuProgramDetail } from "@/types/dining";

export const dinMenuProgramDetailService = {
  list: async (filter?: Record<string, any>): Promise<DinMenuProgramDetail[]> => {
    try {
      const response = await api.post("/DinMenuProgramDetail/List", {
        Filter: filter || {},
      });
      if (response.data?.Succeeded) {
        return response.data.Data || [];
      }
      return [];
    } catch (error) {
      console.error("Error in dinMenuProgramDetailService.list", error);
      throw error;
    }
  },
};
