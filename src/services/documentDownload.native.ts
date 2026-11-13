import { offlineDocumentsService } from '@/services/offlineDocuments';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { storage } from '@/lib/storage';
import { fileService } from '@/services/fileService';
import * as cacheStore from '@/services/pdfCacheStore.native';

/**
 * Descarga temporal: se usa para entregar el archivo al visor del sistema.
 * No sobrevive a una limpieza del sistema, asi que no cuenta como offline.
 */
const TEMP_DIRECTORY = new Directory(Paths.cache, 'nova-connect', 'pdf');

function tempFile(fileId: number): File {
  return new File(TEMP_DIRECTORY, `doc-${fileId}.pdf`);
}

async function fetchTo(
  fileId: number,
  destination: File,
  onProgress?: (received: number, total: number) => void,
): Promise<string> {
  const token = await storage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const file = await File.downloadFileAsync(
    fileService.getFileUrl(fileId),
    destination,
    {
      headers,
      idempotent: true,
      onProgress: ({ bytesWritten, totalBytes }) =>
        onProgress?.(bytesWritten, totalBytes),
    },
  );
  return file.uri;
}

/**
 * Descarga el documento con la sesion actual a un archivo temporal.
 *
 * La descarga directa a disco es la unica forma de llevar la credencial: la
 * URL de GenFiles la exige, asi que abrirla en el navegador del sistema
 * devolveria 401.
 */
export async function downloadDocument(
  fileId: number,
  onProgress?: (received: number, total: number) => void,
): Promise<string> {
  TEMP_DIRECTORY.create({ intermediates: true, idempotent: true });
  const uri = await fetchTo(fileId, tempFile(fileId), onProgress);
  try {
    cacheStore.ensureDirectory();
    await new File(uri).copy(cacheStore.fileFor(fileId), { overwrite: true });
    await offlineDocumentsService.upsert({ fileId });
  } catch {
    // La falta de espacio offline no impide abrir el documento temporal.
  }
  return uri;
}

/**
 * Guarda el documento en el directorio persistente para verlo sin conexion.
 * Devuelve la ruta local del archivo guardado.
 */
export async function cacheDocument(
  fileId: number,
  onProgress?: (received: number, total: number) => void,
): Promise<string | null> {
  cacheStore.ensureDirectory();
  try {
    return await fetchTo(fileId, cacheStore.fileFor(fileId), onProgress);
  } catch {
    return null;
  }
}

/** Ruta local del documento guardado, o null si no esta guardado. */
export async function getCachedDocumentUri(
  fileId: number,
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
 * Entrega el documento al usuario.
 *
 * La aplicacion no incluye un visor PDF embebido: el archivo se descarga
 * autenticado y se entrega al visor del sistema. En iOS el share sheet es la
 * unica via para dejar el PDF en "Archivos", de ahi el titulo del dialogo; en
 * Android ofrece las mismas dos salidas.
 */
export async function saveDocumentToDevice(
  fileId: number,
  fileName: string,
): Promise<void> {
  const cached = await getCachedDocumentUri(fileId);
  const uri = cached ?? (await downloadDocument(fileId));

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: fileName,
  });
}
