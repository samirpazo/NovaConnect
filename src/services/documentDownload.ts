import { api } from '@/lib/axios';
import { fileService } from '@/services/fileService';

/**
 * En web el documento se descarga con la sesion y se muestra embebido en un
 * iframe. El blob vive en memoria: no hay cache persistente en disco.
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
