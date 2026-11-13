import { personPhotoCache } from '@/services/personPhotoCache';
import { api, API_URL } from '@/lib/axios';

/**
 * Servicio de los archivos administrados (GenFiles).
 *
 * NovaApi guarda el documento en el servicio unificado de archivos: el
 * contenido se pide por identificador (`/GenFiles/{id}/preview`) y no por
 * nombre de archivo. La descarga exige credenciales, por eso el cliente
 * autenticado no puede abrir la URL directamente en el navegador del sistema.
 */
export const fileService = {
  /** URL del archivo. En nativo requiere Authorization: no la abras fuera de la app. */
  getFileUrl(fileId: number): string {
    return `${API_URL}/GenFiles/${fileId}/preview`;
  },

  /**
   * Foto de la persona del colaborador autenticado.
   *
   * `GET /GenPerson/MyPhoto` devuelve el archivo de la foto activa usando el
   * PrsID del claim del token, sin permisos adicionales. Antes la app usaba
   * `user.PrsPhoto`, un campo que NovaApi nunca envia: la foto nunca se
   * solicitaba y el avatar caia siempre en las iniciales.
   */
  async getCachedMyPhoto(owner: string): Promise<string | null> {
    return personPhotoCache.get(owner);
  },

  async getMyPhoto(owner?: string): Promise<string | null> {
    try {
      const response = await api.get('/GenPerson/MyPhoto', {
        responseType: 'arraybuffer',
      });
      const contentType = String(response.headers['content-type'] ?? '').split(
        ';',
      )[0];
      if (!contentType.startsWith('image/'))
        throw new Error('La respuesta no es una imagen.');
      const bytes = new Uint8Array(response.data);
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const source = `data:${contentType};base64,${btoa(binary)}`;
      if (owner) await personPhotoCache.set(owner, source);
      return source;
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (owner && status === 404) {
        await personPhotoCache.remove(owner);
        return null;
      }
      return owner ? personPhotoCache.get(owner) : null;
    }
  },
};
