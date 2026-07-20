import { api } from "@/lib/axios";
import { DinMenuType } from "@/types/dining";

export const dinMenuTypeService = {
  list: async (filter?: Record<string, any>): Promise<DinMenuType[]> => {
    try {
      const response = await api.post("/DinMenuType/List", {
        Filter: filter || {},
      });
      if (response.data?.Succeeded) {
        return response.data.Data || [];
      }
      return [];
    } catch (error) {
      console.error("Error in dinMenuTypeService.list", error);
      throw error;
    }
  },
};
