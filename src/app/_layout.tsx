import { GestureHandlerRootView } from "react-native-gesture-handler";
import "@/global.css";

import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { PortalHost } from "@rn-primitives/portal";
import { Stack, useRouter, useSegments } from "expo-router";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, colorScheme as nativewindColorScheme } from "nativewind";
import { useEffect, useState, useMemo } from "react";
import { Platform, View, Dimensions, useColorScheme as useRNColorScheme } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import * as SystemUI from "expo-system-ui";
import { Toaster } from "@/lib/sonner";
import SessionWrapper from "@/components/SessionWrapper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

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

function ThemeEffects() {
  const { theme } = usePreferenceStore();
  const { colorScheme } = useAppTheme();
  const rnColorScheme = useRNColorScheme();
  const { setColorScheme: setNativeWindColorScheme } = useColorScheme();

  useEffect(() => {
    setNativeWindColorScheme(theme);
    const activeTheme = theme === "system" ? (rnColorScheme === "dark" ? "dark" : "light") : theme;
    SystemUI.setBackgroundColorAsync(activeTheme === "dark" ? "#1a1a1c" : "#ffffff").catch(() => {});
  }, [theme, rnColorScheme]);

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Toaster
        theme={colorScheme as 'light' | 'dark' | 'system' || 'system'}
        position="top-center"
        toastOptions={{
          titleStyle: {
            color: colorScheme === 'dark' ? '#ffffff' : '#000000',
            fontFamily: 'Poppins_600SemiBold',
          },
          descriptionStyle: {
            color: colorScheme === 'dark' ? '#a1a1aa' : '#71717a',
            fontFamily: 'Poppins_400Regular',
          },
          style: {
            width: Platform.OS === "web" ? 400 : "auto",
            alignSelf: "center",
            backgroundColor: colorScheme === 'dark' ? '#1a1a1c' : '#ffffff',
            borderColor: colorScheme === 'dark' ? '#27272a' : '#e4e4e7',
          },
        }}
      />
    </>
  );
}

function NavigationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { primaryColor } = usePreferenceStore();
  const { colorScheme } = useAppTheme();

  const isDark = colorScheme === "dark";
  const myTheme = useMemo(() => ({
    dark: isDark,
    colors: {
      primary: primaryColor || "#002aff",
      background: isDark ? "#1a1a1c" : "#ffffff",
      card: isDark ? "#1a1a1c" : "#ffffff", // Tab and Header background
      text: isDark ? "#ffffff" : "#000000",
      border: isDark ? "#27272a" : "#e4e4e7",
      notification: primaryColor || "#002aff",
    },
    fonts: DefaultTheme.fonts,
  }), [isDark, primaryColor]);

  return <ThemeProvider value={myTheme}>{children}</ThemeProvider>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { user, loading: authLoading, initializeAuth } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useProtectedRoute(user, authLoading, isReady);

  useEffect(() => {
    const initApp = async () => {
      await new Promise<void>((resolve) => {
        if (usePreferenceStore.persist.hasHydrated()) return resolve();
        const unsub = usePreferenceStore.persist.onFinishHydration(() => {
          resolve();
          unsub();
        });
      });

      await initializeAuth();
      
      const currentTheme = usePreferenceStore.getState().theme;
      nativewindColorScheme.set(currentTheme);

      setIsReady(true);
      await SplashScreen.hideAsync();
    };

    if (fontsLoaded || fontError) {
      initApp();
    }
  }, [fontsLoaded, fontError]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
          <Head>
            <title>Nova Connect</title>
            <meta name="description" content="Portal oficial de los colaboradores de Nova" />
            <meta property="og:title" content="Nova Connect" />
            <meta property="og:description" content="Portal oficial de los colaboradores de Nova" />
            <meta property="og:image" content="https://novateam-001-site3.itempurl.com/opengraph-image.png" />
          </Head>
          <SessionWrapper>
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
              <ThemeEffects />
              <NavigationThemeWrapper>
                <Stack>
                  <Stack.Screen name="(protected)" options={{ headerShown: false }} />
                </Stack>
              </NavigationThemeWrapper>
              <PortalHost />
            </View>
          </SessionWrapper>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
