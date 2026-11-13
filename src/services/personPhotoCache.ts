/** Caché persistente de fotos, separada por persona y de la caché de PDF. */
const CACHE_NAME = 'nova-connect-person-photos-v1';
const keyFor = (owner: string) => `/cached_photo/${encodeURIComponent(owner)}`;

export const personPhotoCache = {
  async get(owner: string): Promise<string | null> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(keyFor(owner));
      return response ? await response.text() : null;
    } catch {
      return null;
    }
  },
  async set(owner: string, source: string): Promise<void> {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(keyFor(owner), new Response(source));
    } catch {
      /* Una cuota agotada no impide mostrar la foto descargada. */
    }
  },
  async remove(owner: string): Promise<void> {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(keyFor(owner));
    } catch {
      /* Caché no disponible. */
    }
  },
  async clear(): Promise<void> {
    try {
      await caches.delete(CACHE_NAME);
    } catch {
      /* Caché no disponible. */
    }
  },
};
