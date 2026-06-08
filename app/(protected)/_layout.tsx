import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { Clock, FileText, User, Utensils } from "lucide-react-native";
import { Platform, Text, View } from "react-native";

export default function ProtectedLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1e293b",
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleAlign: "center",
        headerTitle: () => (
          <View className="flex-row items-center justify-center gap-2">
            <Image
              source={require("@/assets/images/logo-nova.svg")}
              style={{ width: 40, height: 35 }}
              contentFit="contain"
            />
            <Text className="text-white font-bold text-xl tracking-tight">
              Nova Connect
            </Text>
          </View>
        ),
        tabBarActiveTintColor: "#002aff",
        tabBarInactiveTintColor: "#ffffff",
        tabBarStyle: {
          backgroundColor: "#1e293b",
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documentos Pe...",
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial de Doc...",
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="dining"
        options={{
          title: "Comedor",
          tabBarIcon: ({ color, size }) => (
            <Utensils color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide settings from bottom tabs
        }}
      />
    </Tabs>
  );
}
