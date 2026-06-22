import { useState, useCallback } from "react";
import { ProcessedDocument } from "@/types/document";
import { processedDocumentService } from "@/services/processedDocumentService";
import { useFocusEffect } from "expo-router";

export function useProcessedDocuments(isReceived: boolean) {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await processedDocumentService.getDocuments(isReceived);
      setDocuments(data);
    } catch (err) {
      setError("No se pudieron cargar los documentos.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isReceived]);

  // Se ejecuta automáticamente cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      fetchDocuments();
    }, [fetchDocuments])
  );

  return {
    documents,
    isLoading,
    isRefreshing,
    error,
    refetch: () => fetchDocuments(true),
  };
}
