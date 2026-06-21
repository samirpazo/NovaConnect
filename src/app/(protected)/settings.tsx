import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { secCollaboratorPreferenceService } from "@/services/secCollaboratorPreferenceService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Stack, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CheckIcon,
  ChevronLeft,
  CloudUploadIcon,
  MonitorIcon,
  MoonStarIcon,
  SunIcon,
} from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "dark", label: "Oscuro", icon: MoonStarIcon },
  { value: "system", label: "Sistema", icon: MonitorIcon },
] as const;

const COLORS = [
  { value: "#002aff", label: "Azul" },
  { value: "#10b981", label: "Verde" },
  { value: "#f43f5e", label: "Rojo" },
  { value: "#8b5cf6", label: "Púrpura" },
  { value: "#f97316", label: "Naranja" },
  { value: "#14b8a6", label: "Teal" },
] as const;

export default function SettingsScreen() {
  const { theme, primaryColor: storePrimaryColor, setPreferences } = usePreferenceStore();
  const primaryColor = storePrimaryColor?.toLowerCase() === '#ff0000' || storePrimaryColor?.toLowerCase() === 'ff0000' ? '#002aff' : storePrimaryColor;
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await secCollaboratorPreferenceService.savePreferences({
        Theme: theme,
        PrimaryColor: primaryColor,
      });
      AlertHelper.alert(
        "Éxito",
        "Preferencias guardadas en la nube correctamente.",
      );
    } catch (e) {
      console.error(e);
      AlertHelper.alert(
        "Error",
        "Hubo un error al guardar las preferencias en la nube.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable 
          onPress={() => router.back()}
          className="size-11 items-center justify-center rounded-2xl bg-secondary/80 border border-border/40 active:bg-secondary/50"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-poppins-bold text-foreground mr-11">
          Configuración
        </Text>
      </View>

      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-5 pb-24"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="mb-8"
        >
          <Text className="text-2xl font-poppins-bold text-foreground mb-1 tracking-tight">
            Apariencia
          </Text>
          <Text className="text-muted-foreground font-poppins-medium text-sm mb-8">
            Personaliza la interfaz a tu gusto.
          </Text>

          {/* Theme Selector */}
          <View className="mb-8">
            <Text className="text-[11px] font-poppins-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">
              Tema Visual
            </Text>
            <View className="bg-card rounded-[24px] p-1.5 flex-row border border-border/40 shadow-sm">
              {THEME_OPTIONS.map((option) => {
                const isSelected = theme === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setPreferences(option.value, primaryColor)}
                    className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-[20px] ${isSelected ? "bg-background shadow-sm border border-border/50" : ""}`}
                  >
                    <Icon
                      as={option.icon}
                      size={18}
                      color={isSelected ? primaryColor : undefined}
                      className={
                        isSelected
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    />
                    <Text
                      className={`text-sm font-poppins-semibold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Color Picker */}
          <View className="mb-2">
            <Text className="text-[11px] font-poppins-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">
              Color Principal
            </Text>
            <View className="bg-card rounded-[24px] p-6 border border-border/40 shadow-sm">
              <View className="flex-row flex-wrap gap-5 justify-center">
                {COLORS.map((color) => {
                  const isSelected = primaryColor === color.value;
                  return (
                    <Pressable
                      key={color.value}
                      onPress={() => setPreferences(theme, color.value)}
                      className="items-center justify-center"
                    >
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center`}
                        style={{
                          backgroundColor: color.value,
                          borderWidth: isSelected ? 4 : 0,
                          borderColor: isSelected ? `${color.value}40` : "transparent",
                        }}
                      >
                         {isSelected && (
                           <View className="w-full h-full rounded-full border-2 border-background absolute" />
                         )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Sync Button */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200).springify()}
          className="gap-3 mt-6"
        >
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="w-full h-14 rounded-[20px] flex-row items-center justify-center gap-3 active:opacity-80 shadow-sm"
            style={{ backgroundColor: primaryColor || "#002aff" }}
          >
            <Icon as={CloudUploadIcon} size={22} color="#ffffff" />
            <Text className="text-white font-poppins-semibold text-base">
              {isSaving ? "Guardando..." : "Sincronizar en la Nube"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
