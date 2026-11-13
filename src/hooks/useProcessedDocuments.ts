import { useNetwork } from "@/hooks/useNetwork";
import { useState, useCallback } from "react";
import { ProcessedDocument } from "@/types/document";
import { processedDocumentService } from "@/services/processedDocumentService";
import { useFocusEffect } from "expo-router";

export function useProcessedDocuments(isReceived: boolean) {
  const isOnline = useNetwork();
  const canLoad = isReceived || isOnline;
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (refresh = false) => {
    if (!canLoad) return;
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
  }, [isReceived, canLoad]);

  // Se ejecuta automáticamente cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      fetchDocuments();
    }, [fetchDocuments])
  );

  return {
    documents: canLoad ? documents : [],
    isLoading: canLoad && isLoading,
    isRefreshing: canLoad && isRefreshing,
    error: canLoad ? error : null,
    refetch: () => fetchDocuments(true),
  };
}
