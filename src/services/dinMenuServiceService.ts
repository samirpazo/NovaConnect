import { api } from "@/lib/axios";

export interface DinMenuService {
  MsvID: number;
  MsvName: string;
  MsvTimeStart: string;
  MsvTimeEnd: string;
  SecStatus: boolean;
}

export const dinMenuServiceService = {
  list: async (filter?: Record<string, any>): Promise<DinMenuService[]> => {
    try {
      const response = await api.post("/DinMenuService/List", {
        Filter: filter || {},
      });
      if (response.data?.Succeeded) {
        return response.data.Data || [];
      }
      return [];
    } catch (error) {
      console.error("Error in dinMenuServiceService.list", error);
      throw error;
    }
  },
};
