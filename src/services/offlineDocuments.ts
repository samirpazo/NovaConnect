import { storage } from '@/lib/storage';

const KEY = 'nova-connect.offlineDocuments';

/**
 * Registro de documentos guardados en el dispositivo para poder abrirlos sin
 * conexion. El archivo vive en la cache del sistema; aqui solo queda el
 * identificador para poder mostrar el estado en la lista.
 */
export const offlineDocumentsService = {
  async list(): Promise<number[]> {
    try {
      const raw = await storage.getItem(KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (value): value is number => typeof value === 'number' && value > 0
      );
    } catch {
      return [];
    }
  },

  async add(fileId: number): Promise<void> {
    const ids = await this.list();
    if (ids.includes(fileId)) return;
    await storage.setItem(KEY, JSON.stringify([...ids, fileId]));
  },

  async remove(fileId: number): Promise<void> {
    const ids = await this.list();
    await storage.setItem(
      KEY,
      JSON.stringify(ids.filter(id => id !== fileId))
    );
  },
};
