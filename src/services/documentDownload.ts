import { api } from '@/lib/axios';
import { fileService } from '@/services/fileService';

/**
 * En web el documento se descarga con la sesion y se abre en una pestana nueva.
 * No hace falta cache en disco: el navegador gestiona el blob.
 */
export async function downloadDocument(
  fileId: number,
  onProgress?: (received: number, total: number) => void
): Promise<string> {
  const response = await api.get(fileService.getFileUrl(fileId), {
    responseType: 'blob',
    onDownloadProgress: (event) => {
      const total = event.total ?? 0;
      onProgress?.(event.loaded ?? 0, total);
    },
  });
  return window.URL.createObjectURL(
    new Blob([response.data], { type: 'application/pdf' })
  );
}

/** En web el blob vive en memoria: no hay cache persistente. */
export async function isDocumentCached(_fileId: number): Promise<boolean> {
  return false;
}

/** Abre el documento en una pestana nueva con la credencial de la sesion. */
export async function openDocument(fileId: number): Promise<void> {
  const url = await downloadDocument(fileId);
  window.open(url, '_blank');
}
