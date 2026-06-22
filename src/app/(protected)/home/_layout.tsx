import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";

export default function HomeLayout() {
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor;

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerTintColor: primaryColor || "#002aff",
        headerStyle: {
          backgroundColor: isDark ? "#1a1a1c" : "#ffffff",
        },
        headerTitleStyle: {
          fontFamily: "Poppins_600SemiBold",
          color: isDark ? "#ffffff" : "#000000",
        },
        headerShadowVisible: false,
        headerBackTitle: "",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ title: "Centro de Ayuda" }} />
      <Stack.Screen name="settings" options={{ title: "Configuración" }} />
    </Stack>
  );
}
