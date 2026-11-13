import { useCallback, useEffect, useState } from 'react';

import { downloadDocument } from '@/services/documentDownload';
import { offlineDocumentsService } from '@/services/offlineDocuments';

/**
 * Documentos guardados en el dispositivo.
 *
 * El colaborador descarga sus documentos antes de salir a campo: sin conexion
 * el visor usa la copia local y no depende del servidor.
 */
export function useOfflineDocuments() {
  const [cachedIds, setCachedIds] = useState<number[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null
  );

  const refresh = useCallback(async () => {
    const ids = await offlineDocumentsService.list();
    setCachedIds(ids);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ids = await offlineDocumentsService.list();
      if (!cancelled) setCachedIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cache = useCallback(
    async (fileId: number) => {
      setDownloadingId(fileId);
      try {
        await downloadDocument(fileId);
        await offlineDocumentsService.add(fileId);
        await refresh();
        return true;
      } catch {
        return false;
      } finally {
        setDownloadingId(null);
      }
    },
    [refresh]
  );

  const cacheAll = useCallback(
    async (fileIds: number[]) => {
      const pending = fileIds.filter(id => !cachedIds.includes(id));
      if (pending.length === 0) return { done: 0, failed: 0 };
      setProgress({ done: 0, total: pending.length });
      let done = 0;
      let failed = 0;
      for (const id of pending) {
        const ok = await cache(id);
        if (ok) done += 1;
        else failed += 1;
        setProgress({ done: done + failed, total: pending.length });
      }
      setProgress(null);
      return { done, failed };
    },
    [cache, cachedIds]
  );

  return {
    cachedIds,
    isCached: (fileId: number) => cachedIds.includes(fileId),
    downloadingId,
    progress,
    cache,
    cacheAll,
    refresh,
  };
}
