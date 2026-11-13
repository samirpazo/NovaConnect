import { api, API_URL } from "@/lib/axios";
import { ProcessedDocument } from "@/types/document";

export const processedDocumentService = {
  async getDocuments(
    isReceived: boolean
  ): Promise<ProcessedDocument[]> {
    try {
      const { data } = await api.get(
        `/MpwProcessedDocument/GetByPrsID?PdcIsReceived=${isReceived}`
      );
      return data.Data || [];
    } catch (error) {
      console.error("Error fetching processed documents:", error);
      throw error;
    }
  },

  async receiveDocument(document: ProcessedDocument): Promise<boolean> {
    try {
      const payload = { ...document, PdcIsReceived: true };
      const { data } = await api.put(
        `/MpwProcessedDocument/Update?id=${document.PdcID}`,
        payload
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
  }
};
