import { api } from '@/lib/axios';

export const fileService = {
  getFile: async (
    genParameter: string,
    nameFile: string,
    isImg: boolean = false
  ): Promise<string> => {
    try {
      const response = await api.get('/GenUploadFiles/downloadFile', {
        params: { genParameter, nameFile, isImg },
      });
      if (isImg) {
        return response.data.base64;
      }
      return '';
    } catch (error) {
      console.error('Error fetching file:', error);
      throw error;
    }
  }
};
