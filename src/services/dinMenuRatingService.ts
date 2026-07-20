import { api } from "@/lib/axios";

export interface DinMenuRating {
  MrtID?: number;
  MpdID: number;
  PrsID: number;
  MrtRating: number;
  MrtComment?: string;
}

export const dinMenuRatingService = {
  save: async (rating: DinMenuRating): Promise<boolean> => {
    try {
      const response = await api.post("/DinMenuRating/Save", rating);
      return response.data?.Succeeded || false;
    } catch (error) {
      console.error("Error saving menu rating", error);
      throw error;
    }
  },
  update: async (id: number, rating: DinMenuRating): Promise<boolean> => {
    try {
      const response = await api.put(`/DinMenuRating/Update?id=${id}`, rating);
      return response.data?.Succeeded || false;
    } catch (error) {
      console.error("Error updating menu rating", error);
      throw error;
    }
  },
};
