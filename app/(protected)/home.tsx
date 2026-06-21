import { NImage } from "@/components/custom/NImage";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Briefcase,
  Building2,
  ChevronRight,
  HelpCircle,
  IdCard,
  LogOut,
  QrCode,
  Settings,
} from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor;

  const handleSettings = () => {
    router.push("/(protected)/settings");
  };

  const handleLogout = async () => {
    AlertHelper.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar tu sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="w-full max-w-lg self-center px-5 gap-8 mt-1">
          {/* App Header */}
          <View className="flex-row items-center gap-2.5 px-1">
            <Image
              source={require("@/assets/images/logo-nova.svg")}
              style={{ width: 26, height: 22 }}
              contentFit="contain"
            />
            <Text className="text-foreground/50 text-sm font-poppins-medium tracking-tight">
              Nova Connect
            </Text>
          </View>

          {/* Profile Hero */}
          <View className="items-center gap-4">
            <View
              className="w-24 h-24 rounded-full border-[3px] overflow-hidden items-center justify-center bg-muted"
              style={{ borderColor: primaryColor || "#002aff" }}
            >
              <NImage
                genParameter="ROUTE_PERSONS"
                fileName={user?.PrsPhoto}
                className="w-full h-full"
                fallbackText={user?.PrsName?.[0] || "U"}
              />
            </View>
            <View className="items-center gap-1.5">
              <Text className="text-2xl font-poppins-semibold text-foreground tracking-tight text-center uppercase leading-tight">
                {user?.FullName || "SANTOS VILCHEZ EDINSON PASCUAL"}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: primaryColor || "#002aff" }}
                />
                <Text className="text-sm font-poppins-medium text-muted-foreground">
                  {user?.PstName || user?.TypeWorkerName || "PROGRAMADOR"}
                </Text>
              </View>
            </View>
          </View>

          {/* Personal Info */}
          <View className="bg-card rounded-2xl overflow-hidden">
            <View className="flex-row items-center gap-3.5 px-5 py-4">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` || "#002aff15" }}
              >
                <IdCard size={18} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-poppins-medium text-muted-foreground">
                  Documento de Identidad
                </Text>
                <Text className="text-base font-poppins-semibold text-foreground">
                  {user?.PrsDocumentNumber || "72103034"}
                </Text>
              </View>
            </View>
            <View className="h-[1px] bg-border mx-5" />
            <View className="flex-row items-center gap-3.5 px-5 py-4">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` || "#002aff15" }}
              >
                <Briefcase size={18} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-poppins-medium text-muted-foreground">
                  Cargo
                </Text>
                <Text className="text-base font-poppins-semibold text-foreground uppercase">
                  {user?.PstName || user?.TypeWorkerName || "PROGRAMADOR"}
                </Text>
              </View>
            </View>
            <View className="h-[1px] bg-border mx-5" />
            <View className="flex-row items-center gap-3.5 px-5 py-4">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` || "#002aff15" }}
              >
                <Building2 size={18} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-poppins-medium text-muted-foreground">
                  Área
                </Text>
                <Text className="text-base font-poppins-semibold text-foreground uppercase">
                  {user?.AreName || "TECNOLOGÍA DE LA INFORMACIÓN"}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="gap-3">
            <Text className="text-xs font-poppins-semibold text-muted-foreground uppercase tracking-widest px-1">
              Acciones
            </Text>

            <Pressable
              onPress={() => {}}
              className="flex-row items-center gap-4 p-4 rounded-2xl bg-secondary active:bg-secondary/80"
            >
              <View className="w-10 h-10 rounded-xl bg-card items-center justify-center">
                <QrCode size={20} className="text-foreground" />
              </View>
              <Text className="flex-1 font-poppins-medium text-foreground text-base">
                Código QR
              </Text>
              <ChevronRight size={18} className="text-muted-foreground" />
            </Pressable>

            <Pressable
              onPress={() => {}}
              className="flex-row items-center gap-4 p-4 rounded-2xl bg-secondary active:bg-secondary/80"
            >
              <View className="w-10 h-10 rounded-xl bg-card items-center justify-center">
                <HelpCircle size={20} className="text-foreground" />
              </View>
              <Text className="flex-1 font-poppins-medium text-foreground text-base">
                Centro de Ayuda
              </Text>
              <ChevronRight size={18} className="text-muted-foreground" />
            </Pressable>

            <Pressable
              onPress={handleSettings}
              className="flex-row items-center gap-4 p-4 rounded-2xl bg-secondary active:bg-secondary/80"
            >
              <View className="w-10 h-10 rounded-xl bg-card items-center justify-center">
                <Settings size={20} className="text-foreground" />
              </View>
              <Text className="flex-1 font-poppins-medium text-foreground text-base">
                Configuración
              </Text>
              <ChevronRight size={18} className="text-muted-foreground" />
            </Pressable>
          </View>

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2 py-3"
          >
            <LogOut size={15} className="text-muted-foreground" />
            <Text className="font-poppins-medium text-sm text-muted-foreground">
              Cerrar Sesión
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
