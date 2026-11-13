import { Stack } from "expo-router";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { useColorScheme } from "nativewind";

export default function HistoryLayout() {
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
      <Stack.Screen name="[year]/index" options={{ title: "" }} />
      <Stack.Screen name="[year]/[month]/index" options={{ title: "Detalles por mes" }} />
    </Stack>
  );
}
