import { BiometricRow } from "@/components/profile/BiometricRow";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { showToast } from "@/lib/toast";
import { biometricService } from "@/services/biometricService";
import { useOfflineDocuments } from "@/hooks/useOfflineDocuments";
import { queuePreferenceSave } from "@/services/secCollaboratorPreferenceService";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Stack } from "expo-router";
import {
  Check,
  ChevronRight,
  HardDriveIcon,
  MonitorIcon,
  MoonStarIcon,
  Palette,
  ShieldCheckIcon,
  SunIcon,
} from "lucide-react-native";
import * as React from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
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

  const [saveStatus, setSaveStatus] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [customColorOpen, setCustomColorOpen] = React.useState(false);
  const mounted = React.useRef(true);
  const revision = React.useRef(0);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [biometricSupported, setBiometricSupported] = React.useState(false);
  const offline = useOfflineDocuments();
  const [clearingOffline, setClearingOffline] = React.useState(false);
  const offlineCount = offline.cachedIds.length;

  React.useEffect(() => {
    void biometricService.isSupported().then(setBiometricSupported);
    void biometricService.isEnabled().then(setBiometricEnabled);
  }, []);

  const handleClearOffline = () => {
    AlertHelper.alert(
      "Liberar espacio",
      "Se borraran los documentos guardados para verlos sin conexion. Los demas seguiran disponibles en el servidor.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Liberar",
          style: "destructive",
          onPress: async () => {
            setClearingOffline(true);
            try {
              await offline.clearAll();
              showToast.success(
                "Espacio liberado",
                "Ya no hay documentos guardados sin conexion."
              );
            } catch {
              showToast.error(
                "Error",
                "No se pudieron borrar los documentos guardados."
              );
            } finally {
              setClearingOffline(false);
            }
          },
        },
      ]
    );
  };

  const updatePreferences = (nextTheme: typeof theme, nextColor: string) => {
    setPreferences(nextTheme, nextColor);
    setColorScheme(nextTheme);
    setSaveStatus("saving");
    const currentRevision = ++revision.current;
    queuePreferenceSave(
      { Theme: nextTheme, PrimaryColor: nextColor },
      (saved) => {
        if (mounted.current && revision.current === currentRevision) {
          setSaveStatus(saved ? "saved" : "error");
        }
      },
    );
  };

  const onColorComplete = (color: { hex: string }) => {
    updatePreferences(theme, color.hex);
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
          <View className="mb-6 gap-1">
            <Text className="text-2xl font-poppins-bold text-foreground">
              Configuración
            </Text>
            <Text className="text-sm font-poppins text-muted-foreground">
              Haz que Nova Connect se sienta tuyo.
            </Text>
          </View>

          {/* Apariencia */}
          <View className="mb-8">
            <View className="mb-3 flex-row items-center gap-2.5 px-1">
              <Palette size={18} color={primaryColor} />
              <Text className="text-base font-poppins-semibold text-foreground">
                Apariencia
              </Text>
            </View>

            <View className="mb-4 flex-row gap-2 rounded-2xl border border-border/40 bg-secondary/50 p-1.5">
              {THEME_OPTIONS.map((option) => {
                const isSelected = theme === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      updatePreferences(option.value, primaryColor);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Tema ${option.label}`}
                    className={`flex-1 flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 ${
                      isSelected
                        ? "border border-border/50 bg-card shadow-sm"
                        : ""
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: `${primaryColor}26` }
                        : undefined
                    }
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
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-sm font-poppins-semibold text-foreground">
                  Color de acento
                </Text>
                <Text className="text-xs font-poppins text-muted-foreground">
                  {primaryColor.toUpperCase()}
                </Text>
              </View>
              <View className="flex-row flex-wrap justify-between gap-2">
                {COLORS.map((color) => {
                  const isSelected =
                    primaryColor.toLowerCase() === color.value.toLowerCase();
                  return (
                    <Pressable
                      key={color.value}
                      onPress={() => updatePreferences(theme, color.value)}
                      accessibilityRole="button"
                      accessibilityLabel={`Color ${color.label}`}
                      accessibilityState={{ selected: isSelected }}
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
                      >
                        {isSelected ? (
                          <Check size={20} color="#ffffff" strokeWidth={3} />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View className="mt-4 border-t border-border/40 pt-4">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-poppins-medium text-foreground">
                      Color personalizado
                    </Text>
                    <Text className="mt-1 text-xs font-poppins text-muted-foreground">
                      Elige otro tono para la aplicación
                    </Text>
                  </View>
                  {Platform.OS === "web" ? (
                    React.createElement("input", {
                      type: "color",
                      value: primaryColor,
                      "aria-label": "Elegir color personalizado",
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        onColorComplete({ hex: e.target.value }),
                      style: {
                        width: 44,
                        height: 44,
                        padding: 3,
                        border: "1px solid #71717a",
                        borderRadius: 10,
                        backgroundColor: "transparent",
                        cursor: "pointer",
                      },
                    })
                  ) : (
                    <Pressable
                      onPress={() => setCustomColorOpen(!customColorOpen)}
                      accessibilityRole="button"
                      accessibilityLabel="Elegir color personalizado"
                      accessibilityState={{ expanded: customColorOpen }}
                      className="h-11 w-11 rounded-xl border border-border"
                      style={{ backgroundColor: primaryColor }}
                    />
                  )}
                </View>
              </View>
              {Platform.OS !== "web" && customColorOpen ? (
                <View className="mt-4 w-full items-center">
                  <ColorPicker
                    style={{ width: "100%", gap: 16 }}
                    value={primaryColor}
                    onComplete={onColorComplete}
                  >
                    <Panel1 style={{ height: 160, borderRadius: 16 }} />
                    <HueSlider style={{ borderRadius: 12, height: 24 }} />
                  </ColorPicker>
                </View>
              ) : null}
            </View>
          </View>

          {/* Seguridad y acceso */}
          <View className="mb-8">
            <View className="mb-3 flex-row items-center gap-2.5 px-1">
              <ShieldCheckIcon size={18} color={primaryColor} />
              <Text className="text-base font-poppins-semibold text-foreground">
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
                    ],
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
                    Contraseña y PIN
                  </Text>
                  <Text className="mt-1.5 text-xs leading-5 font-poppins-medium text-muted-foreground">
                    Código de acceso de 6 dígitos
                  </Text>
                </View>
                <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary/60">
                  <Icon
                    as={ChevronRight}
                    size={16}
                    className="text-muted-foreground"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Almacenamiento offline */}
          <View className="mb-8">
            <View className="mb-3 flex-row items-center gap-2.5 px-1">
              <HardDriveIcon size={18} color={primaryColor} />
              <Text className="text-base font-poppins-semibold text-foreground">
                Almacenamiento offline
              </Text>
            </View>

            <View className="flex-row items-center gap-4 rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
              <View
                className="h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${primaryColor}1f` }}
              >
                <HardDriveIcon size={24} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-poppins-bold text-foreground">
                  Documentos guardados
                </Text>
                <Text className="mt-1.5 text-xs leading-5 font-poppins-medium text-muted-foreground">
                  {offlineCount === 0
                    ? "No tienes documentos guardados sin conexión"
                    : `${offlineCount} ${
                        offlineCount === 1 ? "documento guardado" : "documentos guardados"
                      } para ver sin conexión`}
                </Text>
              </View>
              {offlineCount > 0 ? (
                <Pressable
                  onPress={handleClearOffline}
                  disabled={clearingOffline}
                  accessibilityRole="button"
                  accessibilityLabel="Liberar el espacio de los documentos guardados sin conexión"
                  className="rounded-xl border border-border/40 bg-secondary/50 px-3 py-2 active:opacity-70 disabled:opacity-50"
                >
                  <Text className="text-xs font-poppins-semibold text-foreground">
                    {clearingOffline ? "Limpiando…" : "Liberar"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View
            accessibilityLiveRegion="polite"
            className="items-center px-4 pb-4"
          >
            <Text className="text-center text-xs font-poppins text-muted-foreground">
              {saveStatus === "saving"
                ? "Guardando cambios…"
                : saveStatus === "saved"
                  ? "Cambios sincronizados"
                  : saveStatus === "error"
                    ? "Guardado en este dispositivo. No se pudo sincronizar."
                    : "Tus cambios se guardan automáticamente."}
            </Text>
            {saveStatus === "error" ? (
              <Pressable
                onPress={() => updatePreferences(theme, primaryColor)}
                accessibilityRole="button"
                className="mt-2 px-4 py-2"
              >
                <Text className="text-sm font-poppins-semibold text-foreground">
                  Reintentar sincronización
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}
