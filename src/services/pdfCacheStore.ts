/**
 * Almacenamiento offline de documentos en web.
 *
 * Usa la Cache API del navegador: el PDF se guarda en el almacen del
 * navegador y se sigue disponible sin conexion. Es el equivalente web del
 * directorio persistente que usa la version nativa.
 */

const CACHE_NAME = 'nova-connect-pdf-cache-v1';
const KEY_PREFIX = '/cached_pdf/';

const keyFor = (fileId: number) => `${KEY_PREFIX}${fileId}.pdf`;

function cacheApiAvailable(): boolean {
  return typeof caches !== 'undefined' && caches !== null;
}

/** Indica si el documento esta guardado para verse sin conexion. */
export async function isStored(fileId: number): Promise<boolean> {
  if (!cacheApiAvailable()) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    return !!(await cache.match(keyFor(fileId)));
  } catch {
    return false;
  }
}

/**
 * Devuelve una URL de objeto con el PDF guardado, o null si no esta.
 * Cada llamada crea su propia URL para que cada visor pueda revocarla sin
 * afectar a otro visor abierto.
 */
export async function read(fileId: number): Promise<string | null> {
  if (!cacheApiAvailable()) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(keyFor(fileId));
    if (!match) return null;
    const blob = await match.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/** Guarda el PDF en el almacen del navegador. */
export async function write(fileId: number, blob: Blob): Promise<boolean> {
  if (!cacheApiAvailable()) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(blob, {
      headers: { 'Content-Type': 'application/pdf' },
    });
    await cache.put(keyFor(fileId), response);
    return true;
  } catch {
    // Modo privado o cuota agotada: el documento se podra ver, pero no quedar
    // disponible sin conexion.
    return false;
  }
}

/** Elimina un documento del almacen offline. */
export async function remove(fileId: number): Promise<void> {
  if (!cacheApiAvailable()) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(keyFor(fileId));
  } catch {
    // Sin efecto: el documento se mostrara como no guardado.
  }
}

/** Libera todo el espacio ocupado por los documentos offline. */
export async function clear(): Promise<void> {
  if (!cacheApiAvailable()) return;
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    // Sin efecto.
  }
}

/** Identificadores de los documentos guardados sin conexion. */
export async function list(): Promise<number[]> {
  if (!cacheApiAvailable()) return [];
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const ids: number[] = [];
    for (const request of requests) {
      const fileName = request.url.split('/').pop();
      if (!fileName || !fileName.endsWith('.pdf')) continue;
      const id = Number(fileName.replace(/\.pdf$/, ''));
      if (Number.isInteger(id) && id > 0) ids.push(id);
    }
    return ids;
  } catch {
    return [];
  }
}
