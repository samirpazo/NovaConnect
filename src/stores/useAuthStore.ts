import { logger } from '@/lib/logger';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '@/services/authService';
import { AuthResponse } from '@/types/auth';
import { setGlobalLogoutCallback } from '@/lib/axios';
import { storage } from '@/lib/storage';

interface AuthState {
  user: AuthResponse['User'] | null;
  loading: boolean;
  isAuthenticating: boolean;
  pinLocked: boolean;
  initializeAuth: () => Promise<void>;
  login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  unlock: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      isAuthenticating: false,
      pinLocked: true,

      initializeAuth: async () => {
        try {
          const user = await authService.getSession();
          if (user) {
            set({ user, loading: false, pinLocked: true });
          } else {
            set({ loading: false });
          }
        } catch (error) {
          logger.error('Error initializing auth', error);
          set({ loading: false });
        }
      },

      login: async (credentials) => {
        set({ isAuthenticating: true });
        try {
          const result = await authService.loginCollaborator(credentials);
          if (result.success && result.data) {
            set({ user: result.data.User, pinLocked: false });
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
        set({ user: null, pinLocked: false });
      },

      unlock: () => {
        set({ pinLocked: false });
      },
    }),
    {
      name: 'nova-auth-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Setup global logout callback (used when token expires)
setGlobalLogoutCallback(() => {
  useAuthStore.getState().logout();
});
