import { create } from 'zustand';
import { authService } from '@/services/authService';
import { AuthResponse } from '@/types/auth';
import { setGlobalLogoutCallback } from '@/lib/axios';

interface AuthState {
  user: AuthResponse['User'] | null;
  loading: boolean;
  isAuthenticating: boolean;
  initializeAuth: () => Promise<void>;
  login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isAuthenticating: false,

  initializeAuth: async () => {
    try {
      // Evitamos el auto-login automático para forzar siempre el uso de PIN o Biometría
      // const user = await authService.getSession();
      // if (user) {
      //   set({ user });
      // }
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
        return { success: false, error: result.error };
      }
    } finally {
      set({ isAuthenticating: false });
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null });
  }
}));

// Setup global logout callback (used when token expires)
setGlobalLogoutCallback(() => {
  useAuthStore.getState().logout();
});
