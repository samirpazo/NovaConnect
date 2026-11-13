import { Directory, File, Paths } from 'expo-file-system';

const directory = new Directory(
  Paths.document,
  'nova-connect',
  'person-photos',
);
const fileFor = (owner: string) =>
  new File(directory, `${encodeURIComponent(owner)}.txt`);

/** Guarda el data URI completo en disco, sin ocupar SecureStore con la imagen. */
export const personPhotoCache = {
  async get(owner: string): Promise<string | null> {
    try {
      const file = fileFor(owner);
      return file.exists ? await file.text() : null;
    } catch {
      return null;
    }
  },
  async set(owner: string, source: string): Promise<void> {
    try {
      directory.create({ intermediates: true, idempotent: true });
      fileFor(owner).write(source);
    } catch {
      /* Una falta de espacio no impide mostrar la foto descargada. */
    }
  },
  async remove(owner: string): Promise<void> {
    try {
      const file = fileFor(owner);
      if (file.exists) file.delete();
    } catch {
      /* Caché no disponible. */
    }
  },
  async clear(): Promise<void> {
    try {
      if (directory.exists) directory.delete();
    } catch {
      /* Caché no disponible. */
    }
  },
};
