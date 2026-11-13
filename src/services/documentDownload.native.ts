import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { storage } from '@/lib/storage';
import { fileService } from '@/services/fileService';

const CACHE_DIRECTORY = new Directory(Paths.cache, 'nova-connect', 'pdf');

function cachedFile(fileId: number): File {
  return new File(CACHE_DIRECTORY, `doc-${fileId}.pdf`);
}

/**
 * Descarga el documento con la sesion actual y lo deja en la cache del
 * dispositivo.
 *
 * La descarga directa a disco es la unica forma de llevar la credencial: la
 * URL de GenFiles la exige, asi que abrirla en el navegador del sistema
 * devolveria 401.
 */
export async function downloadDocument(
  fileId: number,
  onProgress?: (received: number, total: number) => void
): Promise<string> {
  CACHE_DIRECTORY.create({ intermediates: true, idempotent: true });
  const destination = cachedFile(fileId);
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
    }
  );
  return file.uri;
}

/** Indica si el documento ya esta disponible sin conexion. */
export async function isDocumentCached(fileId: number): Promise<boolean> {
  try {
    return cachedFile(fileId).exists;
  } catch {
    return false;
  }
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
  fileName: string
): Promise<void> {
  const cached = await isDocumentCached(fileId);
  const uri = cached ? cachedFile(fileId).uri : await downloadDocument(fileId);

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: fileName,
  });
}
