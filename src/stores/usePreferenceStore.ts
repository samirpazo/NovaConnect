import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferenceState {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setPrimaryColor: (color: string) => void;
  setPreferences: (theme: 'light' | 'dark' | 'system', color: string) => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      theme: 'system',
      primaryColor: '#002aff', // Default Nova color
      
      setTheme: (theme) => set({ theme }),
      
      setPrimaryColor: (primaryColor) => set({ primaryColor }),
      
      setPreferences: (theme, primaryColor) => set({ theme, primaryColor }),
    }),
    {
      name: 'nova-collaborator-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
