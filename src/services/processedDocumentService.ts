import { api } from "@/lib/axios";
import { logger } from "@/lib/logger";
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
      logger.error("Error fetching processed documents:", error);
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
      logger.error("Error updating document:", error);
      throw error;
    }
  },
  
  async getPdfBlob(fileId: number): Promise<Blob> {
    const { data } = await api.get(
      `/GenFiles/${fileId}/download`,
      { responseType: "blob" }
    );
    return new Blob([data], { type: "application/pdf" });
  },

};
