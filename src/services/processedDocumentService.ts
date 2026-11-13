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
      const documents = data.Data || [];
      await storage.setItem(
        await documentListKey(isReceived),
        JSON.stringify(documents),
      );
      return documents;
    } catch (error) {
      // Un rechazo del servidor nunca se convierte en acceso local.
      if (!(error as { response?: unknown }).response) {
        const ids = await listCachedDocuments();
        const snapshot = JSON.parse(
          (await storage.getItem(await documentListKey(isReceived))) || "[]",
        ) as ProcessedDocument[];
        if (Array.isArray(snapshot) && snapshot.length) {
          return snapshot.filter((document) => ids.includes(document.PdcFilID));
        }
        if (isReceived) {
          const metadata = await offlineDocumentsService.list();
          return metadata
            .filter(
              (document) =>
                ids.includes(document.fileId) &&
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
      return data.Succeeded || data.Data;
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
