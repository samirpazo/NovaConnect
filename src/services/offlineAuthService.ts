import { storage } from '@/lib/storage';
import { hashPassword } from '@/lib/security';
import { AuthResponse } from '@/types/auth';

/**
 * Sesion local para trabajar sin conexion.
 *
 * Se guarda el documento, el hash del PIN (el mismo que viaja al servidor,
 * nunca el PIN en claro) y los datos del colaborador. Con esa informacion la
 * app puede abrirse sin red y dejar que el colaborador consulte los
 * documentos que ya descargo.
 */

const SESSION_KEY = 'nova-connect.offlineSession';

export type OfflineSession = {
  document: string;
  pinHash: string;
  user: AuthResponse['User'];
  savedAt: number;
};

export const offlineAuthService = {
  /** Recorda la sesion para poder entrar mas tarde sin conexion. */
  async save(
    document: string,
    pinHash: string,
    user: AuthResponse['User'],
  ): Promise<void> {
    if (!document || !pinHash || !user) return;
    const session: OfflineSession = {
      document: document.trim(),
      pinHash,
      user,
      savedAt: Date.now(),
    };
    await storage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  /** Devuelve la sesion guardada en este dispositivo, si la hay. */
  async get(): Promise<OfflineSession | null> {
    try {
      const raw = await storage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<OfflineSession>;
      if (!parsed?.document || !parsed?.pinHash || !parsed?.user) return null;
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
  async verify(
    document: string,
    pin: string,
  ): Promise<OfflineSession | null> {
    const session = await this.get();
    if (!session) return null;
    if (session.document !== document.trim()) return null;
    if (session.pinHash !== hashPassword(pin)) return null;
    return session;
  },

  /** Olvida la sesion local (al cerrar sesion). */
  async clear(): Promise<void> {
    await storage.removeItem(SESSION_KEY);
  },
};
