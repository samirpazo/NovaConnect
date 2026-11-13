import { storage } from '@/lib/storage';
import { ProcessedDocument } from '@/types/document';

const KEY = 'nova-connect.offlineDocuments';

export type OfflineDocument = {
  fileId: number;
  title?: string;
  periodMonth?: string;
  periodYear?: string;
  savedAt: number;
};

/**
 * Metadatos de los documentos guardados sin conexion.
 *
 * El PDF vive en el almacen real (Cache API en web, directorio persistente en
 * nativo). Aqui queda solo la ficha para poder listar los documentos cuando
 * el servidor no responde.
 */
export const offlineDocumentsService = {
  async list(): Promise<OfflineDocument[]> {
    try {
      const raw = await storage.getItem(KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (value): value is OfflineDocument =>
          !!value &&
          typeof value === 'object' &&
          typeof (value as OfflineDocument).fileId === 'number' &&
          (value as OfflineDocument).fileId > 0,
      );
    } catch {
      return [];
    }
  },

  async upsert(document: Omit<OfflineDocument, 'savedAt'>): Promise<void> {
    const documents = await this.list();
    const next = documents.filter(item => item.fileId !== document.fileId);
    next.push({ ...document, savedAt: Date.now() });
    await storage.setItem(KEY, JSON.stringify(next));
  },

  async remove(fileId: number): Promise<void> {
    const documents = await this.list();
    await storage.setItem(
      KEY,
      JSON.stringify(documents.filter(item => item.fileId !== fileId)),
    );
  },

  async clear(): Promise<void> {
    await storage.setItem(KEY, JSON.stringify([]));
  },
};

/** Ficha offline a partir de un documento procesado. */
export function toOfflineInput(document: ProcessedDocument) {
  return {
    fileId: document.PdcFilID,
    title: document.DprDisplayName,
    periodMonth: document.PdcPeriodMonth,
    periodYear: document.PdcPeriodYear,
  };
}
