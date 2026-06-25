import { registerForPushNotificationsAsync } from "@/hooks/usePushNotifications";
import { pushNotificationService } from "@/services/pushNotificationService";
import { useAuthStore } from "@/stores/useAuthStore";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { Clock, FileText, User, Utensils } from "lucide-react-native";
import { useEffect } from "react";
import { Dimensions, Platform, Text, View } from "react-native";

import { useTheme } from "@react-navigation/native";

function HeaderLogo() {
  const { dark: isDark } = useTheme();
  const screenWidth = Dimensions.get("window").width;

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
        width: Platform.OS === "web" ? Math.min(512, screenWidth) : screenWidth,
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
}

function TabIcon({ color, focused, icon: IconComponent }: any) {
  const { colors } = useTheme();
  return (
    <View className="items-center justify-center h-full w-full">
      <IconComponent
        color={color}
        size={22}
        strokeWidth={focused ? 2.5 : 1.8}
      />
      {focused && (
        <View
          style={{ backgroundColor: colors.primary }}
          className="w-1 h-1 rounded-full absolute -bottom-0.5"
        />
      )}
    </View>
  );
}

export default function ProtectedLayout() {
  const { user } = useAuthStore();

  useEffect(() => {
    async function setupPush() {
      if (user?.PrsID && Platform.OS !== "web") {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await pushNotificationService.saveToken(user.PrsID, token);
        }
      }
    }
    setupPush();
  }, [user?.PrsID]);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: "",
        headerShadowVisible: false,
        headerLeft: () => <HeaderLogo />,
        tabBarShowLabel: true,
        tabBarStyle: {
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
          tabBarIcon: (props) => <TabIcon {...props} icon={User} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documentos",
          href: "/(protected)/documents",
          tabBarIcon: (props) => <TabIcon {...props} icon={FileText} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          href: "/(protected)/history",
          tabBarIcon: (props) => <TabIcon {...props} icon={Clock} />,
        }}
      />
      <Tabs.Screen
        name="dining"
        options={{
          title: "Comedor",
          href: "/(protected)/dining",
          tabBarIcon: (props) => <TabIcon {...props} icon={Utensils} />,
        }}
      />
    </Tabs>
  );
}
