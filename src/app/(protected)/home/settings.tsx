import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { secCollaboratorPreferenceService } from "@/services/secCollaboratorPreferenceService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Stack } from "expo-router";
import {
  CloudUploadIcon,
  MonitorIcon,
  MoonStarIcon,
  SunIcon,
  Palette,
} from "lucide-react-native";
import * as React from "react";
import { Platform, Pressable, ScrollView, View, ActivityIndicator } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ColorPicker, { Panel1, HueSlider } from "reanimated-color-picker";
import { useColorScheme } from "nativewind";

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
  const { setColorScheme } = useColorScheme();
  
  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor || "#002aff";
      
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await secCollaboratorPreferenceService.savePreferences({
        Theme: theme,
        PrimaryColor: primaryColor,
      });
      AlertHelper.alert("Éxito", "Preferencias guardadas en la nube correctamente.");
    } catch (e) {
      console.error(e);
      AlertHelper.alert("Error", "Hubo un error al guardar las preferencias en la nube.");
    } finally {
      setIsSaving(false);
    }
  };

  const onColorComplete = (color: { hex: string }) => {
    setPreferences(theme, color.hex);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-5 pb-24"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).springify()} className="mb-6">
          <View className="mb-6">
            <Text className="text-2xl font-poppins-bold text-foreground mb-1 tracking-tight">
              Apariencia
            </Text>
            <Text className="text-muted-foreground font-poppins-medium text-sm">
              Personaliza tu experiencia visual.
            </Text>
          </View>

          {/* Theme Selector */}
          <View className="mb-8">
            <View className="flex-row items-center mb-3 px-1">
              <MoonStarIcon size={18} className="text-foreground mr-2" />
              <Text className="text-base font-poppins-bold text-foreground">
                Tema Visual
              </Text>
            </View>
            <View className="bg-secondary/50 rounded-[20px] p-1 flex-row border border-border/40 shadow-sm">
              {THEME_OPTIONS.map((option) => {
                const isSelected = theme === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setPreferences(option.value, primaryColor);
                      setColorScheme(option.value);
                    }}
                    className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[16px] ${
                      isSelected ? "bg-card shadow-sm border border-border/50" : ""
                    }`}
                  >
                    <Icon
                      as={option.icon}
                      size={16}
                      color={isSelected ? primaryColor : undefined}
                      className={isSelected ? "text-foreground" : "text-muted-foreground"}
                    />
                    <Text
                      className={`text-xs font-poppins-bold ${
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Color Picker */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3 px-1">
              <Palette size={18} className="text-foreground mr-2" />
              <Text className="text-base font-poppins-bold text-foreground">
                Color Principal
              </Text>
            </View>

            <View className="bg-card rounded-[24px] p-5 border border-border/40 shadow-sm">
              <Text className="text-[10px] font-poppins-bold text-muted-foreground uppercase tracking-widest mb-3 text-center">
                Predefinidos
              </Text>
              <View className="flex-row flex-wrap gap-3 justify-center mb-6">
                {COLORS.map((color) => {
                  const isSelected = primaryColor.toLowerCase() === color.value.toLowerCase();
                  return (
                    <Pressable
                      key={color.value}
                      onPress={() => setPreferences(theme, color.value)}
                      className="items-center justify-center"
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center shadow-sm"
                        style={{
                          backgroundColor: color.value,
                          borderWidth: isSelected ? 3 : 0,
                          borderColor: isSelected ? `${color.value}40` : "transparent",
                        }}
                      >
                        {isSelected && (
                          <View className="w-full h-full rounded-full border-[2px] border-card absolute" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View className="h-[1px] w-full bg-border/40 mb-5" />

              <Text className="text-[10px] font-poppins-bold text-muted-foreground uppercase tracking-widest mb-4 text-center">
                Personalizado Libre
              </Text>
              
              <View className="items-center w-full">
                {Platform.OS === "web" ? (
                  React.createElement("input", {
                    type: "color",
                    value: primaryColor,
                    onChange: (e: any) => onColorComplete({ hex: e.target.value }),
                    style: {
                      width: "100%",
                      height: 80,
                      borderRadius: 16,
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      backgroundColor: "transparent",
                    },
                  })
                ) : (
                  <ColorPicker
                    style={{ width: "100%", gap: 16 }}
                    value={primaryColor}
                    onComplete={onColorComplete}
                  >
                    <Panel1 style={{ height: 160, borderRadius: 16 }} />
                    <HueSlider style={{ borderRadius: 12, height: 24 }} />
                  </ColorPicker>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Sync Button */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200).springify()}
          className="mt-2"
        >
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="w-full h-12 rounded-[16px] flex-row items-center justify-center gap-2 active:opacity-80 shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <CloudUploadIcon size={20} color="#ffffff" strokeWidth={2.5} />
            )}
            <Text className="text-white font-poppins-bold text-sm">
              {isSaving ? "Guardando..." : "Sincronizar"}
            </Text>
          </Pressable>
          <Text className="text-center text-[10px] font-poppins text-muted-foreground mt-3 px-6">
            Los cambios se guardan localmente. Sincroniza para aplicarlos en todos tus dispositivos.
          </Text>
        </Animated.View>
      </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}
