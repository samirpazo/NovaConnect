import { Stack, router, usePathname } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { TouchableOpacity, Platform } from "react-native";
import { ChevronLeft } from "lucide-react-native";

function CustomBackButton() {
  const { colors } = useTheme();
  const pathname = usePathname();
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
      <ChevronLeft size={28} color={colors.primary} />
    </TouchableOpacity>
  );
}

export default function HistoryLayout() {
  const pathname = usePathname();

  return (
    <Stack
      screenOptions={{
        headerTitleStyle: {
          fontFamily: "Poppins_600SemiBold",
        },
        headerShadowVisible: false,
        headerBackTitle: "",
        headerLeft: ({ canGoBack }) => {
          if (Platform.OS === "web" || !canGoBack) {
            return <CustomBackButton />;
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
