import { create } from 'zustand';
import { authService } from '@/services/authService';
import { offlineAuthService } from '@/services/offlineAuthService';
import { storage } from '@/lib/storage';
import { AuthResponse } from '@/types/auth';
import { setGlobalLogoutCallback, markSessionOpen } from '@/lib/axios';

interface AuthState {
  user: AuthResponse['User'] | null;
  loading: boolean;
  isAuthenticating: boolean;
  initializeAuth: () => Promise<void>;
  login: (
    credentials: any,
  ) => Promise<{ success: boolean; error?: string; offline?: boolean }>;
  loginOffline: (
    credentials: any,
  ) => Promise<{ success: boolean; error?: string; offline?: boolean }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isAuthenticating: false,

  initializeAuth: async () => {
    try {
      const user = await authService.getSession();
      if (user) {
        set({ user });
      }
    } catch (error) {
      console.error('Error initializing auth', error);
    } finally {
      set({ loading: false });
    }
  },

  login: async (credentials) => {
    set({ isAuthenticating: true });
    try {
      const result = await authService.loginCollaborator(credentials);
      if (result.success && result.data) {
        set({ user: result.data.User });
        return { success: true };
      } else {
        if (result.networkError) {
          const session = await offlineAuthService.verifyHash(
            credentials?.DocumentNumber ?? '',
            credentials?.Password ?? '',
          );
          if (session) {
            await storage.setItem('user', JSON.stringify(session.user));
            markSessionOpen();
            set({ user: session.user });
            return { success: true, offline: true };
          }
        }
        return { success: false, error: result.error };
      }
    } finally {
      set({ isAuthenticating: false });
    }
  },

  /**
   * Entrar con las credenciales recordadas en este dispositivo.
   * Solo funciona sin conexion: con red manda el login normal.
   */
  loginOffline: async (credentials) => {
    const session = await offlineAuthService.verify(
      credentials?.DocumentNumber ?? '',
      credentials?.Pin ?? '',
    );
    if (!session) {
      return {
        success: false,
        error:
          'No hay una sesion guardada para ese documento en este dispositivo.',
      };
    }
    await storage.setItem('user', JSON.stringify(session.user));
    markSessionOpen();
    set({ user: session.user });
    return { success: true, offline: true };
  },

  logout: async () => {
    await authService.logout();
    set({ user: null });
  },
}));

// Setup global logout callback (used when token expires)
setGlobalLogoutCallback(() => {
  void offlineAuthService
    .clear()
    .finally(() => useAuthStore.getState().logout());
});
