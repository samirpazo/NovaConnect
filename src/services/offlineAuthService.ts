import { personPhotoCache } from '@/services/personPhotoCache';
import { clearCachedDocuments } from '@/services/documentDownload';
import { offlineDocumentsService } from '@/services/offlineDocuments';
import CryptoJS from 'crypto-js';
import { storage } from '@/lib/storage';
import { hashPassword } from '@/lib/security';
import { AuthResponse } from '@/types/auth';

/**
 * Sesion local para trabajar sin conexion.
 *
 * Se guarda el documento, un verificador derivado del hash del PIN,
 * nunca el PIN en claro, y los datos del colaborador. Con esa informacion la
 * app puede abrirse sin red y dejar que el colaborador consulte los
 * documentos que ya descargo.
 */

const SESSION_KEY = 'nova-connect.offlineSession';

export type OfflineSession = {
  document: string;
  pinHash?: string;
  verifier?: string;
  salt?: string;
  failures?: number;
  lockedUntil?: number;
  user: AuthResponse['User'];
  savedAt: number;
};

function deriveVerifier(pinHash: string, salt: string): string {
  return CryptoJS.PBKDF2(pinHash, salt, {
    keySize: 8,
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256,
  }).toString();
}

export const offlineAuthService = {
  /** Recorda la sesion para poder entrar mas tarde sin conexion. */
  async save(
    document: string,
    pinHash: string,
    user: AuthResponse['User'],
  ): Promise<void> {
    if (!document || !pinHash || !user) return;
    const previous = await this.get();
    if (previous && previous.document !== document.trim()) {
      await clearCachedDocuments();
      await offlineDocumentsService.clear();
      await personPhotoCache.clear();
    }
    const savedAt = Date.now();
    const salt = `nova-connect-offline:${document.trim()}:${savedAt}`;
    const session: OfflineSession = {
      document: document.trim(),
      salt,
      verifier: deriveVerifier(pinHash, salt),
      user,
      savedAt,
    };
    await storage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  /** Devuelve la sesion guardada en este dispositivo, si la hay. */
  async get(): Promise<OfflineSession | null> {
    try {
      const raw = await storage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<OfflineSession>;
      if (
        typeof parsed?.document !== 'string' ||
        !parsed.user ||
        !(
          typeof parsed.pinHash === 'string' ||
          (typeof parsed.verifier === 'string' &&
            typeof parsed.salt === 'string')
        )
      )
        return null;
      return parsed as OfflineSession;
    } catch {
      return null;
    }
  },

  /**
   * Comprueba las credenciales contra la sesion guardada.
   * El PIN se hashea con la misma funcion que lo hace el servidor, asi que
   * solo hace falta comparar el resultado.
   */
  async verify(document: string, pin: string): Promise<OfflineSession | null> {
    return this.verifyHash(document, hashPassword(pin));
  },

  async verifyHash(
    document: string,
    pinHash: string,
  ): Promise<OfflineSession | null> {
    const session = await this.get();
    if (!session || session.document !== document.trim()) return null;
    if ((session.lockedUntil ?? 0) > Date.now()) return null;
    const matches =
      session.verifier && session.salt
        ? session.verifier === deriveVerifier(pinHash, session.salt)
        : session.pinHash === pinHash;
    if (!matches) {
      const failures = (session.failures ?? 0) + 1;
      await storage.setItem(
        SESSION_KEY,
        JSON.stringify({
          ...session,
          failures,
          lockedUntil: failures >= 5 ? Date.now() + 30000 : 0,
        }),
      );
      return null;
    }
    await storage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...session, failures: 0, lockedUntil: 0 }),
    );
    return session;
  },

  /** Olvida la sesion local (al cerrar sesion). */
  async clear(): Promise<void> {
    await storage.removeItem(SESSION_KEY);
    await personPhotoCache.clear();
    await clearCachedDocuments();
    await offlineDocumentsService.clear();
  },
};
