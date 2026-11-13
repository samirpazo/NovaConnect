import { BiometricRow } from "@/components/profile/BiometricRow";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { showToast } from "@/lib/toast";
import { biometricService } from "@/services/biometricService";
import { secCollaboratorPreferenceService } from "@/services/secCollaboratorPreferenceService";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Stack } from "expo-router";
import {
  CloudUploadIcon,
  MonitorIcon,
  MoonStarIcon,
  Palette,
  ShieldCheckIcon,
  SunIcon,
} from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";
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

export default function ConfigurationScreen() {
  const {
    theme,
    primaryColor: storePrimaryColor,
    setPreferences,
  } = usePreferenceStore();
  const { setColorScheme } = useColorScheme();

  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor || "#002aff";

  const [isSaving, setIsSaving] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [biometricSupported, setBiometricSupported] = React.useState(false);

  React.useEffect(() => {
    void biometricService.isSupported().then(setBiometricSupported);
    void biometricService.isEnabled().then(setBiometricEnabled);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await secCollaboratorPreferenceService.savePreferences({
        Theme: theme,
        PrimaryColor: primaryColor,
      });
      AlertHelper.alert(
        "Éxito",
        "Preferencias guardadas en la nube correctamente."
      );
    } catch (e) {
      console.error(e);
      AlertHelper.alert(
        "Error",
        "Hubo un error al guardar las preferencias en la nube."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const onColorComplete = (color: { hex: string }) => {
    setPreferences(theme, color.hex);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Configuración" }} />
      <View className="flex-1 bg-background">
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8">
            <View className="flex-row items-center gap-4 rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
              <View
                className="h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${primaryColor}1f` }}
              >
                <ShieldCheckIcon size={24} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-poppins-bold text-foreground">
                  Preferencias y Seguridad
                </Text>
                <Text className="mt-1.5 text-xs leading-5 font-poppins-medium text-muted-foreground">
                  Personaliza la apariencia y protege el acceso a tu cuenta
                </Text>
              </View>
            </View>
          </View>

          {/* Apariencia */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center gap-2.5 px-1">
              <Palette size={18} color={primaryColor} />
              <Text className="text-xs font-poppins-bold uppercase tracking-widest text-foreground">
                Apariencia
              </Text>
            </View>

            <View className="mb-4 flex-row gap-2 rounded-[20px] border border-border/40 bg-secondary/50 p-1.5">
              {THEME_OPTIONS.map((option) => {
                const isSelected = theme === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setPreferences(option.value, primaryColor);
                      setColorScheme(option.value);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Tema ${option.label}`}
                    className={`flex-1 flex-col items-center justify-center gap-1.5 rounded-[16px] py-3 ${
                      isSelected ? "border border-border/50 bg-card shadow-sm" : ""
                    }`}
                    style={isSelected ? { backgroundColor: `${primaryColor}26` } : undefined}
                  >
                    <Icon
                      as={option.icon}
                      size={18}
                      color={isSelected ? primaryColor : undefined}
                      className={
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      }
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

            <View className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
              <Text className="mb-3 text-center text-[10px] font-poppins-bold uppercase tracking-widest text-muted-foreground">
                Predefinidos
              </Text>
              <View className="mb-6 flex-row flex-wrap justify-center gap-3">
                {COLORS.map((color) => {
                  const isSelected =
                    primaryColor.toLowerCase() === color.value.toLowerCase();
                  return (
                    <Pressable
                      key={color.value}
                      onPress={() => setPreferences(theme, color.value)}
                      accessibilityRole="button"
                      accessibilityLabel={`Color ${color.label}`}
                      className="items-center justify-center"
                    >
                      <View
                        className="h-10 w-10 items-center justify-center rounded-full shadow-sm"
                        style={{
                          backgroundColor: color.value,
                          borderWidth: isSelected ? 3 : 0,
                          borderColor: isSelected
                            ? `${color.value}40`
                            : "transparent",
                        }}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <View className="mb-5 h-[1px] w-full bg-border/40" />

              <Text className="mb-4 text-center text-[10px] font-poppins-bold uppercase tracking-widest text-muted-foreground">
                Personalizado libre
              </Text>

              <View className="w-full items-center">
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

          {/* Seguridad y acceso */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center gap-2.5 px-1">
              <ShieldCheckIcon size={18} color={primaryColor} />
              <Text className="text-xs font-poppins-bold uppercase tracking-widest text-foreground">
                Seguridad y acceso
              </Text>
            </View>

            <View className="gap-4">
              <BiometricRow
                enabled={biometricEnabled}
                supported={biometricSupported}
                primaryColor={primaryColor}
                onEnable={() => setBiometricEnabled(true)}
                onDisable={() => {
                  AlertHelper.alert(
                    "Desactivar biometría",
                    "¿Seguro que deseas desactivar el acceso biométrico en este dispositivo?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Desactivar",
                        style: "destructive",
                        onPress: async () => {
                          await biometricService.disable();
                          setBiometricEnabled(false);
                        },
                      },
                    ]
                  );
                }}
              />

              <View className="flex-row items-center gap-4 rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${primaryColor}1f` }}
                >
                  <ShieldCheckIcon size={24} color={primaryColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-poppins-bold text-foreground">
                    Cambiar Contraseña / PIN
                  </Text>
                  <Text className="mt-1.5 text-xs leading-5 font-poppins-medium text-muted-foreground">
                    Actualiza tu código PIN de 6 dígitos
                  </Text>
                </View>
                <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary/60">
                  <Text className="text-sm font-poppins-bold text-muted-foreground">
                    ›
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sincronizar */}
          <View>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Guardar las preferencias en la nube"
              className="w-full flex-row items-center justify-center gap-2 rounded-[16px] active:opacity-80 disabled:opacity-60"
              style={{ backgroundColor: primaryColor, paddingVertical: 16 }}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <CloudUploadIcon size={20} color="#ffffff" strokeWidth={2.5} />
              )}
              <Text className="text-sm font-poppins-bold text-white">
                {isSaving ? "Guardando..." : "Sincronizar"}
              </Text>
            </Pressable>
            <Text className="mt-4 px-4 text-center text-xs leading-5 font-poppins text-muted-foreground">
              Los cambios se guardan localmente. Sincroniza para aplicarlos en
              todos tus dispositivos.
            </Text>
          </View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}
