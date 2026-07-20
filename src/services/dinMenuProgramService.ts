import { api } from "@/lib/axios";
import { DinMenuProgram } from "@/types/dining";

export const dinMenuProgramService = {
  list: async (filter?: Record<string, any>): Promise<DinMenuProgram[]> => {
    try {
      const response = await api.post("/DinMenuProgram/List", {
        Filter: filter || {},
      });
      if (response.data?.Succeeded) {
        return response.data.Data || [];
      }
      return [];
    } catch (error) {
      console.error("Error in dinMenuProgramService.list", error);
      throw error;
    }
  },
  getAssignedMobile: async (targetDate: string): Promise<any[]> => {
    try {
      const response = await api.get(`/DinMenuProgram/GetAssignedMobile?targetDate=${targetDate}`);
      if (response.data?.Succeeded) {
        return response.data.Data || [];
      }
      return [];
    } catch (error) {
      console.error("Error in dinMenuProgramService.getAssignedMobile", error);
      throw error;
    }
  },
};
