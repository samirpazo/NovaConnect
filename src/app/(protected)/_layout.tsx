import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { Clock, FileText, User, Utensils } from "lucide-react-native";
import { Dimensions, Platform, Text, View } from "react-native";

import { useColorScheme } from "nativewind";

export default function ProtectedLayout() {
  const { primaryColor } = usePreferenceStore();
  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === "dark";
  const surfaceColor = isDark ? "#1a1a1c" : "#ffffff";
  const textMutedColor = isDark ? "#a1a1aa" : "#71717a";
  const borderColor = isDark ? "#27272a" : "#e4e4e7";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: surfaceColor,
        },
        headerLeft: () => {
          const screenWidth = Dimensions.get("window").width;
          return (
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                right: 0,
                width:
                  Platform.OS === "web"
                    ? Math.min(512, screenWidth)
                    : screenWidth,
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Image
                  source={require("../../../assets/images/logo-nova.svg")}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                >
                  Nova Connect
                </Text>
              </View>
            </View>
          );
        },
        tabBarActiveTintColor: primaryColor || "#002aff",
        tabBarInactiveTintColor: textMutedColor,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: surfaceColor,
          borderTopColor: borderColor,
          borderTopWidth: 0.5,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Perfil",
          href: "/(protected)/home",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center h-full w-full">
              <User color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && (
                <View
                  style={{ backgroundColor: primaryColor || "#002aff" }}
                  className="w-1 h-1 rounded-full absolute -bottom-0.5"
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documentos",
          href: "/(protected)/documents",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center h-full w-full">
              <FileText
                color={color}
                size={22}
                strokeWidth={focused ? 2.5 : 1.8}
              />
              {focused && (
                <View
                  style={{ backgroundColor: primaryColor || "#002aff" }}
                  className="w-1 h-1 rounded-full absolute -bottom-0.5"
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          href: "/(protected)/history",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center h-full w-full">
              <Clock
                color={color}
                size={22}
                strokeWidth={focused ? 2.5 : 1.8}
              />
              {focused && (
                <View
                  style={{ backgroundColor: primaryColor || "#002aff" }}
                  className="w-1 h-1 rounded-full absolute -bottom-0.5"
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dining"
        options={{
          title: "Comedor",
          href: "/(protected)/dining",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center h-full w-full">
              <Utensils
                color={color}
                size={22}
                strokeWidth={focused ? 2.5 : 1.8}
              />
              {focused && (
                <View
                  style={{ backgroundColor: primaryColor || "#002aff" }}
                  className="w-1 h-1 rounded-full absolute -bottom-0.5"
                />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
