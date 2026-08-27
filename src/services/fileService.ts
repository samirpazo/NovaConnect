import { api } from '@/lib/axios';
import { logger } from '@/lib/logger';

export const fileService = {
  getManagedImage: async (fileId: number): Promise<string> => {
    try {
      const response = await api.get(`/GenFiles/${fileId}/preview`, {
        responseType: 'blob',
      });
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(response.data as Blob);
      });
    } catch (error) {
      logger.error('Error fetching file:', error);
      throw error;
    }
  },
};
