import "@/global.css";

import { hexToNativeWindHsl } from "@/lib/colorUtils";
import { NAV_THEME } from "@/lib/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { Stack, useRouter, useSegments } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, vars } from "nativewind";
import { useEffect, useState } from "react";
import { Platform, View, Dimensions } from "react-native";
import { Toaster } from "@/lib/sonner";

import { SplashScreen } from "expo-router";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from "expo-router";

function useProtectedRoute(user: any, loading: boolean, isReady: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || !isReady) return;

    const inProtectedGroup = segments[0] === "(protected)";

    if (!user && inProtectedGroup) {
      router.replace("/");
    } else if (user && !inProtectedGroup) {
      router.replace("/(protected)/home");
    }
  }, [user, segments, loading, isReady]);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { colorScheme, setColorScheme } = useColorScheme();
  const { theme, primaryColor } = usePreferenceStore();
  const { user, loading: authLoading, initializeAuth } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useProtectedRoute(user, authLoading, isReady);

  useEffect(() => {
    const initApp = async () => {
      // Esperar a que Zustand recupere el estado de AsyncStorage
      await new Promise<void>((resolve) => {
        if (usePreferenceStore.persist.hasHydrated()) return resolve();
        const unsub = usePreferenceStore.persist.onFinishHydration(() => {
          resolve();
          unsub();
        });
      });

      await initializeAuth();

      // Aplicar el tema recuperado inmediatamente antes de renderizar
      const currentTheme = usePreferenceStore.getState().theme;
      if (currentTheme !== "system" && currentTheme !== colorScheme) {
        setColorScheme(currentTheme);
      }

      setIsReady(true);
      await SplashScreen.hideAsync();
    };

    if (fontsLoaded || fontError) {
      initApp();
    }
  }, [fontsLoaded, fontError]);

  const primaryHsl = hexToNativeWindHsl(primaryColor);

  const themeVars = vars({
    // '--primary': primaryHsl, // Removed so global.css handles primary correctly
  });

  if (!isReady) {
    return null; // Evita el parpadeo de contenido sin estilos
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
      <Head>
        <title>Nova Connect</title>
      </Head>
      <View
        style={[
          { flex: 1 },
          Platform.OS === "web" && {
            maxWidth: 512,
            width: "100%",
            height: Dimensions.get("window").height,
            alignSelf: "center",
            overflow: "hidden",
          },
        ]}
      >
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack>
          <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        </Stack>
        <PortalHost />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              width: Platform.OS === "web" ? 400 : "auto",
              alignSelf: "center",
            },
          }}
        />
      </View>
    </ThemeProvider>
  );
}
