import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, vars } from 'nativewind';
import { View } from 'react-native';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { hexToNativeWindHsl } from '@/lib/colorUtils';
import { useEffect, useState } from 'react';

import { SplashScreen } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { theme, primaryColor } = usePreferenceStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // Esperar a que Zustand recupere el estado de AsyncStorage
      let hydrated = usePreferenceStore.persist.hasHydrated();
      while (!hydrated) {
        await new Promise(r => setTimeout(r, 10));
        hydrated = usePreferenceStore.persist.hasHydrated();
      }

      // Aplicar el tema recuperado inmediatamente antes de renderizar
      const currentTheme = usePreferenceStore.getState().theme;
      if (currentTheme !== 'system' && currentTheme !== colorScheme) {
        setColorScheme(currentTheme);
      }

      setIsReady(true);
      await SplashScreen.hideAsync();
    };

    initApp();
  }, []);

  const primaryHsl = hexToNativeWindHsl(primaryColor);
  
  const themeVars = vars({
    '--primary': primaryHsl,
  });

  if (!isReady) {
    return null; // Evita el parpadeo de contenido sin estilos
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <View style={[{ flex: 1 }, themeVars as any]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack />
        <PortalHost />
      </View>
    </ThemeProvider>
  );
}
