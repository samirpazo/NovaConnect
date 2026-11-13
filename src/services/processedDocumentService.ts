import { storage } from "@/lib/storage";
import { listCachedDocuments } from "@/services/documentDownload";
import { offlineDocumentsService } from "@/services/offlineDocuments";

async function documentListKey(isReceived: boolean) {
  const user = JSON.parse((await storage.getItem("user")) || "null");
  return `nova-connect.documentList:${user?.PrsDocumentNumber || user?.UsrID || ""}:${isReceived}`;
}

import { api, API_URL } from "@/lib/axios";
import { ProcessedDocument } from "@/types/document";

export const processedDocumentService = {
  async getDocuments(isReceived: boolean): Promise<ProcessedDocument[]> {
    try {
      const { data } = await api.get(
        `/MpwProcessedDocument/GetByPrsID?PdcIsReceived=${isReceived}`,
      );
      const documents = (data.Data || []).filter(
        (document: ProcessedDocument) =>
          !!document.PdcIsReceived === isReceived,
      );
      await storage.setItem(
        await documentListKey(isReceived),
        JSON.stringify(documents),
      );
      return documents;
    } catch (error) {
      // Un rechazo del servidor nunca se convierte en acceso local.
      if (!(error as { response?: unknown }).response) {
        if (!isReceived) return [];
        const ids = await listCachedDocuments();
        const snapshot = JSON.parse(
          (await storage.getItem(await documentListKey(isReceived))) || "[]",
        ) as ProcessedDocument[];
        if (Array.isArray(snapshot) && snapshot.length) {
          const metadata = await offlineDocumentsService.list();
          return snapshot.filter(
            (document) =>
              ids.includes(document.PdcFilID) &&
              (metadata.find((item) => item.fileId === document.PdcFilID)
                ?.isReceived ?? !!document.PdcIsReceived) === isReceived,
          );
        }
        if (isReceived) {
          const metadata = await offlineDocumentsService.list();
          return metadata
            .filter(
              (document) =>
                ids.includes(document.fileId) &&
                document.isReceived === true &&
                document.periodYear &&
                document.periodMonth,
            )
            .map((document) => ({
              PdcID: document.fileId,
              PrsID: 0,
              PdcFilID: document.fileId,
              PdcPeriodYear: document.periodYear!,
              PdcPeriodMonth: document.periodMonth!,
              PdcPeriodWeek: null,
              PdcIsReceived: true,
              SecStatus: 1,
              CreateUserId: 0,
              UpdateUserId: null,
              DeleteUserId: null,
              CreateDate: new Date(document.savedAt).toISOString(),
              UpdateDate: null,
              DeleteDate: null,
              DprID: 0,
              DprDisplayName: document.title,
            }));
        }
        return [];
      }
      throw error;
    }
  },

  async receiveDocument(document: ProcessedDocument): Promise<boolean> {
    try {
      const payload = { ...document, PdcIsReceived: true };
      const { data } = await api.put(
        `/MpwProcessedDocument/Update?id=${document.PdcID}`,
        payload,
      );
      const success = !!(data.Succeeded || data.Data);
      if (success) {
        const received = { ...document, PdcIsReceived: true };
        // La confirmación del servidor actualiza también las dos listas locales.
        for (const isReceived of [false, true]) {
          const key = await documentListKey(isReceived);
          const previous = JSON.parse(
            (await storage.getItem(key)) || "[]",
          ) as ProcessedDocument[];
          const next = previous.filter((item) => item.PdcID !== document.PdcID);
          if (isReceived) next.push(received);
          await storage.setItem(key, JSON.stringify(next));
        }
        await offlineDocumentsService.upsert({
          fileId: document.PdcFilID,
          title: document.DprDisplayName,
          periodMonth: document.PdcPeriodMonth,
          periodYear: document.PdcPeriodYear,
          isReceived: true,
        });
      }
      return success;
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  },

  /**
   * URL del documento. El archivo vive en GenFiles: el contenido se sirve con
   * `/GenFiles/{PdcFilID}/preview` y no por nombre de archivo.
   */
  getFileUrl(fileId: number): string {
    return `${API_URL}/GenFiles/${fileId}/preview`;
  },
};
