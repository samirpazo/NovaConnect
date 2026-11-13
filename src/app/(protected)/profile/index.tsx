import { useNetwork } from "@/hooks/useNetwork";
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
import { Headset, LogOut, Settings } from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor || "#002aff";

  const isOnline = useNetwork();
  const photoOwner =
    user?.PrsDocumentNumber || String(user?.PrsID ?? user?.UsrID ?? "");
  const [photoVisible, setPhotoVisible] = React.useState(false);
  const [myPhoto, setMyPhoto] = React.useState<string | null>(null);

  // Muestra la copia local primero y la actualiza al recuperar conexión.
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!photoOwner) return;
      const cached = await fileService.getCachedMyPhoto(photoOwner);
      if (!cancelled) setMyPhoto(cached);
      if (isOnline) {
        const source = await fileService.getMyPhoto(photoOwner);
        if (!cancelled) setMyPhoto(source);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoOwner, isOnline]);

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
        <View className="w-full max-w-lg self-center gap-3 px-4 pt-3">
          <View>
            <View className="items-center rounded-2xl border border-border/40 bg-card px-4 py-5 shadow-sm">
              <ProfileHeader
                photo={myPhoto}
                fullName={user?.FullName || user?.PrsName}
                position={user?.PstName || user?.AreName}
                primaryColor={primaryColor}
                onPressAvatar={() => setPhotoVisible(true)}
              />
            </View>
          </View>

          <View>
            <PersonalInfoCard
              documentNumber={user?.PrsDocumentNumber}
              area={user?.AreName}
              email={user?.UsrEmail}
              phone={user?.PrsPhone}
              primaryColor={primaryColor}
            />
          </View>

          <View>
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
                  onPress: () =>
                    router.push("/(protected)/profile/configuration"),
                },
              ]}
            />
          </View>

          <View>
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
          </View>

          <View className="mt-2 items-center gap-1">
            <Text className="text-center text-xs font-poppins-semibold text-muted-foreground">
              NOVACORE DIGITAL S.A.C.S.
            </Text>
            <Text className="text-center text-xs text-muted-foreground">
              RUC 20616769163 · © {new Date().getFullYear()}
            </Text>
          </View>
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
