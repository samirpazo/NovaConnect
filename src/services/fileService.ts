import { api } from '@/lib/axios';

export const fileService = {
  async getFile(
    genParameter: string,
    nameFile: string,
    isImg: boolean = false
  ): Promise<string> {
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
  },

  /**
   * Foto de la persona del colaborador autenticado.
   *
   * `GET /GenPerson/MyPhoto` devuelve el archivo de la foto activa usando el
   * PrsID del claim del token, sin permisos adicionales. Antes la app depended
   * de `user.PrsPhoto`, un campo que NovaApi nunca envía: la foto nunca se
   * solicitaba y el avatar caía siempre en las iniciales.
   */
  async getMyPhoto(): Promise<string | null> {
    try {
      const response = await api.get('/GenPerson/MyPhoto', {
        responseType: 'arraybuffer',
      });
      const contentType = String(response.headers['content-type'] ?? '').split(
        ';'
      )[0];
      if (!contentType.startsWith('image/')) return null;
      const bytes = new Uint8Array(response.data);
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return `data:${contentType};base64,${btoa(binary)}`;
    } catch {
      // Sin foto, o sin permiso: el avatar sigue funcionando con las iniciales.
      return null;
    }
  },
};
