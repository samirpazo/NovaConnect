import { api, API_URL } from "@/lib/axios";
import { ProcessedDocument } from "@/types/document";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

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
  
  getPdfUrl(fileName: string): string {
    if (!fileName) return "";
    return `${API_URL}/GenUploadFiles/downloadFile?genParameter=ROUTE_BOLETAS&nameFile=${fileName}`;
  },

  async openPdf(fileName: string, primaryColor: string): Promise<void> {
    if (!fileName) return;
    try {
      if (Platform.OS === "web") {
        const { data } = await api.get(
          `/GenUploadFiles/downloadFile?genParameter=ROUTE_BOLETAS&nameFile=${fileName}`,
          { responseType: "blob" }
        );
        const blobUrl = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
        window.open(blobUrl, "_blank");
      } else {
        const url = this.getPdfUrl(fileName);
        await WebBrowser.openBrowserAsync(url, {
          toolbarColor: primaryColor,
        });
      }
    } catch (error) {
      console.error("Error opening PDF:", error);
      throw error;
    }
  }
};
