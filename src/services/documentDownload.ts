import { api } from '@/lib/axios';
import { fileService } from '@/services/fileService';
import * as cacheStore from '@/services/pdfCacheStore';

/**
 * En web el documento se descarga con la sesion y se muestra embebido en un
 * iframe. El blob vive en memoria; para tenerlo disponible sin conexion se
 * guarda en la Cache API del navegador.
 */

async function fetchBlob(
  fileId: number,
  onProgress?: (received: number, total: number) => void
): Promise<Blob> {
  const response = await api.get(fileService.getFileUrl(fileId), {
    responseType: 'blob',
    onDownloadProgress: (event) => {
      const total = event.total ?? 0;
      onProgress?.(event.loaded ?? 0, total);
    },
  });
  return new Blob([response.data], { type: 'application/pdf' });
}

/** Descarga el documento y devuelve una URL de objeto para mostrarlo. */
export async function downloadDocument(
  fileId: number,
  onProgress?: (received: number, total: number) => void
): Promise<string> {
  const blob = await fetchBlob(fileId, onProgress);
  return window.URL.createObjectURL(blob);
}

/**
 * Guarda el documento en el almacen del navegador para verlo sin conexion.
 * Devuelve la URL de objeto del PDF guardado.
 */
export async function cacheDocument(
  fileId: number,
  onProgress?: (received: number, total: number) => void
): Promise<string | null> {
  const blob = await fetchBlob(fileId, onProgress);
  const stored = await cacheStore.write(fileId, blob);
  if (!stored) return null;
  return window.URL.createObjectURL(blob);
}

/** URL de objeto del documento guardado, o null si no esta guardado. */
export async function getCachedDocumentUri(
  fileId: number
): Promise<string | null> {
  return cacheStore.read(fileId);
}

/** Indica si el documento esta guardado para verse sin conexion. */
export async function isDocumentCached(fileId: number): Promise<boolean> {
  return cacheStore.isStored(fileId);
}

/** Identificadores de los documentos guardados sin conexion. */
export async function listCachedDocuments(): Promise<number[]> {
  return cacheStore.list();
}

/** Elimina un documento del almacen offline. */
export async function removeCachedDocument(fileId: number): Promise<void> {
  await cacheStore.remove(fileId);
}

/** Libera todo el espacio ocupado por los documentos offline. */
export async function clearCachedDocuments(): Promise<void> {
  await cacheStore.clear();
}

/**
 * Descarga el documento al equipo del usuario.
 *
 * El blob se declara como octet-stream porque Safari ignora el atributo
 * download cuando el objeto conserva el tipo application/pdf y abre el PDF
 * en una pestana en lugar de guardarlo.
 */
export async function saveDocumentToDevice(
  fileId: number,
  fileName: string
): Promise<void> {
  const response = await api.get(fileService.getFileUrl(fileId), {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.toLowerCase().endsWith('.pdf')
    ? fileName
    : `${fileName}.pdf`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
