import { FullScreenPhotoModal } from "@/components/profile/FullScreenPhotoModal";
import { PersonalInfoCard } from "@/components/profile/PersonalInfoCard";
import { ProfileActionsCard } from "@/components/profile/ProfileActionsCard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { fileService } from "@/services/fileService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { router } from "expo-router";
import {
  GraduationCap,
  Headset,
  LogOut,
  Settings,
} from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor || "#002aff";

  const [photoVisible, setPhotoVisible] = React.useState(false);
  const [myPhoto, setMyPhoto] = React.useState<string | null>(null);

  // La foto se pide una sola vez al backend: el campo PrsPhoto del login
  // nunca llego porque NovaApi no lo envia.
  React.useEffect(() => {
    let cancelled = false;
    void fileService.getMyPhoto().then((source) => {
      if (!cancelled) setMyPhoto(source);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-lg self-center gap-4 px-5 pt-4">
          <Animated.View entering={FadeInDown.duration(400).springify()}>
            <View className="items-center rounded-[24px] border border-border/40 bg-card px-5 py-6 shadow-sm">
              <ProfileHeader
                photo={myPhoto}
                fullName={user?.FullName || user?.PrsName}
                position={user?.PstName || user?.AreName}
                primaryColor={primaryColor}
                onPressAvatar={() => setPhotoVisible(true)}
              />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
          >
            <PersonalInfoCard
              documentNumber={user?.PrsDocumentNumber}
              area={user?.AreName}
              email={user?.UsrEmail}
              phone={user?.PrsPhone}
              primaryColor={primaryColor}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(150).springify()}
          >
            <ProfileActionsCard
              qrValue={user?.PrsDocumentNumber}
              primaryColor={primaryColor}
              actions={[
                {
                  key: "help",
                  label: "Centro de Ayuda",
                  description: "Soporte y preguntas frecuentes",
                  icon: Headset,
                  onPress: () => router.push("/(protected)/profile/helpCenter"),
                },
                {
                  key: "settings",
                  label: "Configuración",
                  description: "Tema, PIN y biometría",
                  icon: Settings,
                  onPress: () => router.push("/(protected)/profile/configuration"),
                },
                {
                  key: "trainings",
                  label: "Capacitaciones",
                  description: "Invitaciones y materiales",
                  icon: GraduationCap,
                  onPress: () => router.push("/(protected)/home/trainings"),
                },
              ]}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(200).springify()}
          >
            <Pressable
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              className="mt-1 flex-row items-center justify-center gap-2.5 rounded-[16px] bg-destructive active:opacity-80"
              style={{ paddingVertical: 16 }}
            >
              <LogOut size={18} color="#ffffff" />
              <Text className="text-base font-poppins-bold text-white">
                Cerrar Sesión
              </Text>
            </Pressable>
          </Animated.View>

          <Text className="mt-1 text-center text-xs italic text-muted-foreground">
            Desarrollado por Equipo TI · 2026
          </Text>
        </View>
      </ScrollView>

      <FullScreenPhotoModal
        visible={photoVisible}
        photo={myPhoto}
        name={user?.FullName || user?.PrsName}
        onClose={() => setPhotoVisible(false)}
      />
    </SafeAreaView>
  );
}
