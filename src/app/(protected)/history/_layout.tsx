import { Stack, router, usePathname } from "expo-router";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { useColorScheme } from "nativewind";
import { TouchableOpacity, Platform } from "react-native";
import { ChevronLeft } from "lucide-react-native";

export default function HistoryLayout() {
  const pathname = usePathname();
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
        headerLeft: ({ canGoBack }) => {
          if (Platform.OS === "web" || !canGoBack) {
            return (
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === "web") {
                    const segments = pathname.split("/").filter(Boolean);
                    segments.pop();
                    const parentPath = "/" + segments.join("/");
                    router.replace(parentPath as any);
                  } else {
                    router.back();
                  }
                }}
                className="mr-1 ml-1 active:opacity-70"
              >
                <ChevronLeft size={28} color={primaryColor || "#002aff"} />
              </TouchableOpacity>
            );
          }
          return undefined;
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[year]/index" options={{ title: "" }} />
      <Stack.Screen name="[year]/[month]/index" options={{ title: "Detalles por mes" }} />
      <Stack.Screen name="viewer" options={{ headerShown: false }} />
    </Stack>
  );
}
