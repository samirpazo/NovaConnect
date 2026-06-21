import { NImage } from "@/components/custom/NImage";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Building2,
  ChevronRight,
  HelpCircle,
  IdCard,
  LogOut,
  Mail,
  Phone,
  QrCode,
  Settings,
} from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
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
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-lg self-center px-5 gap-8 mt-4">
          {/* Profile Hero */}
          <Animated.View entering={FadeInDown.duration(400).springify()}>
            <View className="items-center w-full gap-4">
              <View
                className="w-28 h-28 rounded-full border-4 overflow-hidden items-center justify-center bg-muted/30 shadow-sm"
                style={{ borderColor: `${primaryColor}20` }}
              >
                <NImage
                  genParameter="ROUTE_PERSONS"
                  fileName={user?.PrsPhoto}
                  className="w-full h-full"
                  fallbackText={user?.PrsName?.[0] || "U"}
                />
              </View>
              <View className="items-center gap-1.5 w-full">
                <Text className="text-2xl font-poppins-bold text-foreground tracking-tight text-center leading-tight">
                  {user?.FullName || "Usuario"}
                </Text>
                <View className="flex-row items-center gap-2 bg-secondary/60 px-3 py-1 rounded-full border border-border/40 self-center">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: primaryColor || "#002aff" }}
                  />
                  <Text className="text-xs font-poppins-semibold text-muted-foreground uppercase tracking-wider text-center">
                    {user?.PstName || user?.TypeWorkerName || "No registrado"}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Personal Info */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            className="bg-card rounded-[24px] border border-border/40 overflow-hidden shadow-sm"
          >
            <View className="flex-row items-center gap-4 px-5 py-4">
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` || "#002aff15" }}
              >
                <IdCard size={20} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-poppins-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Documento de Identidad
                </Text>
                <Text className="text-base font-poppins-semibold text-foreground">
                  {user?.PrsDocumentNumber || "No registrado"}
                </Text>
              </View>
            </View>
            <View className="h-[1px] bg-border/40 mx-5" />
            <View className="flex-row items-center gap-4 px-5 py-4">
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` || "#002aff15" }}
              >
                <Building2 size={20} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-poppins-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Área
                </Text>
                <Text className="text-base font-poppins-medium text-foreground capitalize">
                  {(user?.AreName || "No registrado").toLowerCase()}
                </Text>
              </View>
            </View>
            <View className="h-[1px] bg-border/40 mx-5" />
            <View className="flex-row items-center gap-4 px-5 py-4">
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` || "#002aff15" }}
              >
                <Mail size={20} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-poppins-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Correo Electrónico
                </Text>
                <Text className="text-base font-poppins-medium text-foreground">
                  {user?.UsrEmail || "No registrado"}
                </Text>
              </View>
            </View>
            <View className="h-[1px] bg-border/40 mx-5" />
            <View className="flex-row items-center gap-4 px-5 py-4">
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` || "#002aff15" }}
              >
                <Phone size={20} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-poppins-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Teléfono
                </Text>
                <Text className="text-base font-poppins-medium text-foreground">
                  {user?.PrsPhone || "No registrado"}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200).springify()}
          >
            <View className="gap-2.5">
              <Text className="text-[11px] font-poppins-bold text-muted-foreground uppercase tracking-widest px-2 mb-1">
                Acciones Rápidas
              </Text>

              <Pressable
                onPress={() => {}}
                className="flex-row items-center gap-3.5 py-2 px-4 rounded-[16px] bg-card border border-border/40 active:bg-secondary/50"
              >
                <View className="w-9 h-9 rounded-[12px] bg-secondary/80 items-center justify-center">
                  <QrCode size={18} className="text-foreground" />
                </View>
                <Text className="flex-1 font-poppins-semibold text-foreground text-sm">
                  Mi Código QR
                </Text>
                <ChevronRight size={18} className="text-muted-foreground/50" />
              </Pressable>

              <Pressable
                onPress={() => {}}
                className="flex-row items-center gap-3.5 py-2 px-4 rounded-[16px] bg-card border border-border/40 active:bg-secondary/50"
              >
                <View className="w-9 h-9 rounded-[12px] bg-secondary/80 items-center justify-center">
                  <HelpCircle size={18} className="text-foreground" />
                </View>
                <Text className="flex-1 font-poppins-semibold text-foreground text-sm">
                  Centro de Ayuda
                </Text>
                <ChevronRight size={18} className="text-muted-foreground/50" />
              </Pressable>

              <Pressable
                onPress={handleSettings}
                className="flex-row items-center gap-3.5 py-2 px-4 rounded-[16px] bg-card border border-border/40 active:bg-secondary/50"
              >
                <View className="w-9 h-9 rounded-[12px] bg-secondary/80 items-center justify-center">
                  <Settings size={18} className="text-foreground" />
                </View>
                <Text className="flex-1 font-poppins-semibold text-foreground text-sm">
                  Configuración
                </Text>
                <ChevronRight size={18} className="text-muted-foreground/50" />
              </Pressable>
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(300).springify()}
          >
            <Pressable
              onPress={handleLogout}
              className="mt-2 active:opacity-80 rounded-[16px] overflow-hidden shadow-sm border border-red-500/20"
            >
              <LinearGradient
                colors={["#ef4444", "#dc2626"]} // Red-500 to Red-600
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center justify-center gap-2.5 py-4"
              >
                <LogOut size={18} color="#ffffff" />
                <Text className="font-poppins-semibold text-sm text-white">
                  Cerrar Sesión
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
