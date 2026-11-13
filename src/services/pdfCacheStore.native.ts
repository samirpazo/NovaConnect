import { Directory, File, Paths } from 'expo-file-system';

/**
 * Almacenamiento offline de documentos en nativo.
 *
 * Los PDF se guardan en el directorio persistente de la aplicacion (no en la
 * cache del sistema, que puede vaciarse en cualquier momento) para que
 * sigan disponibles sin conexion.
 */

const OFFLINE_DIRECTORY = new Directory(
  Paths.document,
  'nova-connect',
  'pdf-offline',
);

const fileNameFor = (fileId: number) => `doc-${fileId}.pdf`;

export function fileFor(fileId: number): File {
  return new File(OFFLINE_DIRECTORY, fileNameFor(fileId));
}

export function ensureDirectory(): Directory {
  OFFLINE_DIRECTORY.create({ intermediates: true, idempotent: true });
  return OFFLINE_DIRECTORY;
}

/** Indica si el documento esta guardado para verse sin conexion. */
export async function isStored(fileId: number): Promise<boolean> {
  try {
    return fileFor(fileId).exists;
  } catch {
    return false;
  }
}

/** Ruta local del documento guardado, o null si no esta. */
export async function read(fileId: number): Promise<string | null> {
  try {
    const file = fileFor(fileId);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/** Elimina un documento del almacen offline. */
export async function remove(fileId: number): Promise<void> {
  try {
    const file = fileFor(fileId);
    if (file.exists) file.delete();
  } catch {
    // Sin efecto: el documento se mostrara como no guardado.
  }
}

/** Libera todo el espacio ocupado por los documentos offline. */
export async function clear(): Promise<void> {
  try {
    if (OFFLINE_DIRECTORY.exists) OFFLINE_DIRECTORY.delete();
    ensureDirectory();
  } catch {
    // Sin efecto.
  }
}

/** Identificadores de los documentos guardados sin conexion. */
export async function list(): Promise<number[]> {
  try {
    ensureDirectory();
    const entries = OFFLINE_DIRECTORY.list();
    const ids: number[] = [];
    for (const entry of entries) {
      if (!(entry instanceof File)) continue;
      const match = /^doc-(\d+)\.pdf$/.exec(entry.name);
      if (!match) continue;
      const id = Number(match[1]);
      if (Number.isInteger(id) && id > 0) ids.push(id);
    }
    return ids;
  } catch {
    return [];
  }
}
