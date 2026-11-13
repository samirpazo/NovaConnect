import { Platform } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import {
  cacheDocument,
  clearCachedDocuments,
  listCachedDocuments,
} from '@/services/documentDownload';
import {
  offlineDocumentsService,
  subscribeOfflineDocuments,
  OfflineDocument,
} from '@/services/offlineDocuments';

/** Descargas simultaneas: suficiente para ir rapido sin saturar la red. */
const CONCURRENCY = 2;

export type OfflineDocumentInput = {
  fileId: number;
  title?: string;
  periodMonth?: string;
  periodYear?: string;
};

/**
 * Documentos guardados en el dispositivo.
 *
 * El colaborador descarga sus documentos antes de salir a campo: sin conexion
 * el visor usa la copia local y no depende del servidor. El estado se deriva
 * del almacen real (Cache API en web, directorio persistente en nativo), no
 * de un registro aparte: si el archivo se borra, el documento deja de estar
 * disponible sin conexion.
 */
export function useOfflineDocuments() {
  const [cachedIds, setCachedIds] = useState<number[]>([]);
  const [offlineDocuments, setOfflineDocuments] = useState<OfflineDocument[]>(
    [],
  );
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const refresh = useCallback(async () => {
    const [ids, documents] = await Promise.all([
      listCachedDocuments(),
      offlineDocumentsService.list(),
    ]);
    setCachedIds(ids);
    setOfflineDocuments(
      documents.filter((document) => ids.includes(document.fileId)),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [ids, documents] = await Promise.all([
        listCachedDocuments(),
        offlineDocumentsService.list(),
      ]);
      if (!cancelled) {
        setCachedIds(ids);
        setOfflineDocuments(
          documents.filter((document) => ids.includes(document.fileId)),
        );
      }
    })();
    const unsubscribe = subscribeOfflineDocuments(() => {
      if (!cancelled) void refresh();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [refresh]);

  const cache = useCallback(
    async (document: OfflineDocumentInput) => {
      const { fileId } = document;
      setDownloadingId(fileId);
      try {
        const uri = await cacheDocument(fileId);
        if (uri) {
          if (Platform.OS === 'web') URL.revokeObjectURL(uri);
          await offlineDocumentsService.upsert(document);
          await refresh();
        }
        return !!uri;
      } catch {
        return false;
      } finally {
        setDownloadingId(null);
      }
    },
    [refresh],
  );

  const cacheAll = useCallback(
    async (documents: OfflineDocumentInput[]) => {
      const pending = documents.filter(
        (document) => !cachedIds.includes(document.fileId),
      );
      if (pending.length === 0) return { done: 0, failed: 0 };

      setProgress({ done: 0, total: pending.length });

      let done = 0;
      let failed = 0;
      const queue = [...pending];

      const worker = async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (next === undefined) return;
          const ok = await cache(next);
          if (ok) done += 1;
          else failed += 1;
          setProgress({ done: done + failed, total: pending.length });
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () =>
          worker(),
        ),
      );

      setProgress(null);
      await refresh();
      return { done, failed };
    },
    [cache, cachedIds, refresh],
  );

  /** Borra los documentos guardados y libera el espacio ocupado. */
  const clearAll = useCallback(async () => {
    await clearCachedDocuments();
    await offlineDocumentsService.clear();
    await refresh();
  }, [refresh]);

  return {
    cachedIds,
    offlineDocuments,
    isCached: (fileId: number) => cachedIds.includes(fileId),
    downloadingId,
    progress,
    cache,
    cacheAll,
    clearAll,
    refresh,
  };
}
