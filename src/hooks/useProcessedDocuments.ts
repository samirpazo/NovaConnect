import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { processedDocumentService } from "@/services/processedDocumentService";
import { useFocusEffect } from "expo-router";

export function useProcessedDocuments(isReceived: boolean) {
  const query = useQuery({
    queryKey: ['processedDocuments', isReceived],
    queryFn: () => processedDocumentService.getDocuments(isReceived),
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

  // Se ejecuta automáticamente cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      query.refetch();
    }, [query.refetch])
  );

  return {
    documents: query.data || [],
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    error: query.isError ? "No se pudieron cargar los documentos." : null,
    refetch: query.refetch,
  };
}
