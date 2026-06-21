import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Tabs } from "expo-router";
import { Clock, FileText, User, Utensils } from "lucide-react-native";
import { View } from "react-native";

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
        headerShown: false,
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
          tabBarIcon: ({ color, size, focused }) => (
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
          title: "Boletas",
          tabBarIcon: ({ color, size, focused }) => (
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
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center h-full w-full">
              <Clock color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
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
          tabBarIcon: ({ color, size, focused }) => (
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
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
