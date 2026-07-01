import { BioSetupModal } from "@/components/settings/BioSetupModal";
import { ChangePinModal } from "@/components/settings/ChangePinModal";
import { ColorPickerModal } from "@/components/settings/ColorPickerModal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { sanitizePrimaryColor } from "@/lib/colorUtils";
import { logger } from "@/lib/logger";
import { hashPassword } from "@/lib/security";
import { storage } from "@/lib/storage";
import { showToast } from "@/lib/toast";
import { authService } from "@/services/authService";
import { healthService, HealthStatus } from "@/services/healthService";
import { secCollaboratorPreferenceService } from "@/services/secCollaboratorPreferenceService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import * as LocalAuthentication from "expo-local-authentication";
import {
  CloudUploadIcon,
  MonitorIcon,
  MoonStarIcon,
  Palette,
  SunIcon,
  ChevronLeft,
} from "lucide-react-native";
import { router } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
  TextInput,
  InteractionManager,
} from "react-native";
import Animated, { FadeInDown, runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HealthCard = () => {
  const [status, setStatus] = React.useState<HealthStatus | null>(null);
  const [checking, setChecking] = React.useState(true);
  const primaryColor = usePreferenceStore((s) => s.primaryColor) || "#002aff";

  const runCheck = React.useCallback(async () => {
    setChecking(true);
    const result = await healthService.check();
    setStatus(result);
    setChecking(false);
  }, []);

  React.useEffect(() => {
    runCheck();
  }, [runCheck]);

  const isOk = status?.ready && status?.live;

  return (
    <View className="bg-card rounded-[20px] border border-border overflow-hidden p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-poppins-semibold text-foreground">
          Estado del servidor
        </Text>
        {checking ? (
          <ActivityIndicator size="small" color={primaryColor} />
        ) : (
          <Pressable onPress={runCheck} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Text className="text-xs font-poppins-semibold" style={{ color: primaryColor }}>
              Reintentar
            </Text>
          </Pressable>
        )}
      </View>

      {status && (
        <>
          <View className="flex-row items-center gap-3 mb-2">
            <View
              className={`w-3 h-3 rounded-full ${isOk ? "bg-green-500" : "bg-red-500"}`}
            />
            <Text className={`text-sm font-poppins-semibold ${isOk ? "text-green-600" : "text-red-500"}`}>
              {isOk ? "Operativo" : "Problemas de conexión"}
            </Text>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1 bg-secondary rounded-xl p-3">
              <Text className="text-[10px] font-poppins-bold text-muted-foreground uppercase">Ready</Text>
              <View className="flex-row items-center gap-1.5 mt-1">
                <View className={`w-2 h-2 rounded-full ${status.ready ? "bg-green-500" : "bg-red-500"}`} />
                <Text className="text-xs font-poppins-semibold text-foreground">
                  {status.ready ? "DB conectada" : "Falló"}
                </Text>
              </View>
            </View>

            <View className="flex-1 bg-secondary rounded-xl p-3">
              <Text className="text-[10px] font-poppins-bold text-muted-foreground uppercase">Live</Text>
              <View className="flex-row items-center gap-1.5 mt-1">
                <View className={`w-2 h-2 rounded-full ${status.live ? "bg-green-500" : "bg-red-500"}`} />
                <Text className="text-xs font-poppins-semibold text-foreground">
                  {status.live ? "Respondiendo" : "Caído"}
                </Text>
              </View>
            </View>
          </View>

          {status.error && (
            <Text className="text-xs font-poppins text-muted-foreground mt-2 leading-4">
              {status.error}
            </Text>
          )}
        </>
      )}
    </View>
  );
};

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
  const { user, login } = useAuthStore();
  const store = usePreferenceStore.getState();
  const setPreferences = store.setPreferences;

  const [theme, setTheme] = React.useState(store.theme);
  const [storePrimaryColor, setStorePrimaryColor] = React.useState(store.primaryColor);
  const insets = useSafeAreaInsets();

  const primaryColor = sanitizePrimaryColor(storePrimaryColor);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = React.useState(false);
  const [hasHardware, setHasHardware] = React.useState(false);

  // Modal states for PIN
  const [pinModalVisible, setPinModalVisible] = React.useState(false);
  const [oldPin, setOldPin] = React.useState("");
  const [newPin, setNewPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [isChangingPin, setIsChangingPin] = React.useState(false);

  // Biometric setup states
  const [bioSetupModalVisible, setBioSetupModalVisible] = React.useState(false);
  const [bioSetupPin, setBioSetupPin] = React.useState("");
  const [isActivatingBio, setIsActivatingBio] = React.useState(false);

  // Color picker state
  const [isColorPickerVisible, setIsColorPickerVisible] = React.useState(false);

  React.useEffect(() => {
    const checkBiometric = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      setHasHardware(compatible && types.length > 0);

      if (compatible) {
        const bioEnabled = await storage.getItem("isBiometricEnabled");
        setIsBiometricEnabled(bioEnabled === "true");
      }
    };
    if (Platform.OS !== "web") {
      checkBiometric();
    }
  }, []);

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      setBioSetupModalVisible(true);
    } else {
      await storage.removeItem("isBiometricEnabled");
      setIsBiometricEnabled(false);
      showToast.info("Ajustes", "Acceso biométrico desactivado.");
    }
  };

  const handleConfirmBioSetup = async () => {
    if (!user?.PrsDocumentNumber || bioSetupPin.length < 6) return;
    setIsActivatingBio(true);
    try {
      const hashedPassword = await hashPassword(bioSetupPin);
      const result = await login({
        DocumentNumber: user.PrsDocumentNumber,
        Password: hashedPassword,
      });
      
      if (result.success) {
        const bioResult = await LocalAuthentication.authenticateAsync({
          promptMessage: "Activar acceso biométrico",
          fallbackLabel: "Usar PIN",
        });
        if (bioResult.success) {
          // Guardar el hash del PIN para el inicio de sesión biométrico futuro
          await storage.setItem("savedHashedPin", hashedPassword);
          await storage.setItem("isBiometricEnabled", "true");
          setIsBiometricEnabled(true);
          showToast.success("Éxito", "Acceso biométrico activado.");
          setBioSetupModalVisible(false);
          setBioSetupPin("");
        } else {
          showToast.info("Cancelado", "Autenticación biométrica cancelada.");
        }
      } else {
        showToast.error("Error", "PIN incorrecto.");
      }
    } catch (e) {
      showToast.error("Error", "Ocurrió un error al verificar el PIN.");
    } finally {
      setIsActivatingBio(false);
    }
  };

  const handleChangePin = async () => {
    if (newPin !== confirmPin) {
      showToast.error("Error", "El nuevo PIN y su confirmación no coinciden.");
      return;
    }
    if (newPin.length < 6) {
      showToast.error("Error", "El nuevo PIN debe tener al menos 6 dígitos.");
      return;
    }

    setIsChangingPin(true);
    const oldHash = await hashPassword(oldPin);
    const newHash = await hashPassword(newPin);
    const result = await authService.changePassword(oldHash, newHash);
    setIsChangingPin(false);

    if (result.success) {
      // Actualizar el PIN hasheado guardado si la biometría está habilitada
      if (isBiometricEnabled) {
        await storage.setItem("savedHashedPin", newHash);
      }
      showToast.success("Éxito", "Tu PIN ha sido actualizado correctamente.");
      setPinModalVisible(false);
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
    } else {
      showToast.error("Error", result.error || "No se pudo actualizar el PIN.");
      setConfirmPin("");
    }
  };

  // Eliminado el useEffect con timeoutRef para evitar pérdida de datos al desmontar

  const applyColor = (hex: string) => {
    setTheme(theme);
    setStorePrimaryColor(hex);
    setTimeout(() => {
      setPreferences(theme, hex);
      secCollaboratorPreferenceService.savePreferences({ 
        ColID: user?.ColID, 
        Theme: theme, 
        PrimaryColor: hex 
      }).catch((err) => {
        logger.error("Error saving preferences to cloud:", err?.response?.data || err.message);
      });
    }, 100);
  };

  const onColorComplete = (color: { hex: string }) => {
    "worklet";
    runOnJS(applyColor)(color.hex);
  };

  return (
    <>
      <View className="flex-1 bg-background">
        {/* Custom Header */}
        <View className="flex-row items-center px-4 py-2.5 border-b border-border">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
            className="w-8 h-8 items-center justify-center rounded-full bg-secondary"
          >
            <ChevronLeft size={20} color={primaryColor} />
          </Pressable>
          <View className="flex-1 px-3">
            <Text className="text-lg font-poppins-semibold text-foreground">
              Configuración
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="px-4 pt-4"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 100, 100) }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            className="mb-4"
          >
            <View className="mb-4">
              <Text className="text-xl font-poppins-bold text-foreground mb-0.5 tracking-tight">
                Apariencia
              </Text>
              <Text className="text-muted-foreground font-poppins-medium text-xs">
                Personaliza tu experiencia visual.
              </Text>
            </View>

            {/* Theme Selector */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2 px-1 gap-2">
                <MoonStarIcon size={16} className="text-foreground" />
                <Text className="text-sm font-poppins-bold text-foreground">
                  Tema Visual
                </Text>
              </View>
              <View className="bg-secondary rounded-[16px] p-0.5 flex-row border border-border">
                {THEME_OPTIONS.map((option) => {
                  const isSelected = theme === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setTheme(option.value);
                        setStorePrimaryColor(primaryColor);
                        setTimeout(() => {
                          setPreferences(option.value, primaryColor);
                          secCollaboratorPreferenceService.savePreferences({ 
                            ColID: user?.ColID, 
                            Theme: option.value, 
                            PrimaryColor: primaryColor 
                          }).catch((err) => {
                            logger.error("Error saving preferences to cloud:", err?.response?.data || err.message);
                          });
                        }, 100);
                      }}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1,
                      })}
                      className={`flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-[12px] ${
                        isSelected
                          ? "bg-card border border-border"
                          : ""
                      }`}
                    >
                      <Icon
                        as={option.icon}
                        size={14}
                        color={isSelected ? primaryColor : undefined}
                        className={
                          isSelected
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      />
                      <Text
                        className={`text-[11px] font-poppins-bold ${
                          isSelected
                            ? "text-foreground"
                            : "text-muted-foreground"
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
            <View className="mb-4">
              <View className="flex-row items-center mb-2 px-1 gap-2">
                <Palette size={16} className="text-foreground" />
                <Text className="text-sm font-poppins-bold text-foreground">
                  Color Principal
                </Text>
              </View>

              <View className="bg-card rounded-[20px] p-4 border border-border">
                <Text className="text-[10px] font-poppins-bold text-muted-foreground uppercase tracking-widest mb-2 text-center">
                  Predefinidos
                </Text>
                <View className="flex-row flex-wrap gap-2 justify-center mb-4">
                  {COLORS.map((color) => {
                    const isSelected =
                      primaryColor.toLowerCase() === color.value.toLowerCase();
                    return (
                      <Pressable
                        key={color.value}
                        onPress={() => {
                          InteractionManager.runAfterInteractions(() => {
                            setTheme(theme);
                            setStorePrimaryColor(color.value);
                            setTimeout(() => {
                              setPreferences(theme, color.value);
                              secCollaboratorPreferenceService.savePreferences({ 
                                ColID: user?.ColID, 
                                Theme: theme, 
                                PrimaryColor: color.value 
                              }).catch((err) => {
                                logger.error("Error saving preferences to cloud:", err?.response?.data || err.message);
                              });
                            }, 100);
                          });
                        }}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                        })}
                        className="items-center justify-center"
                      >
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: color.value,
                            borderWidth: isSelected ? 3 : 0,
                            borderColor: isSelected
                              ? `${color.value}40`
                              : "transparent",
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

                <View className="h-[1px] w-full bg-border mb-4" />

                <Text className="text-[10px] font-poppins-bold text-muted-foreground uppercase tracking-widest mb-3 text-center">
                  Personalizado Libre
                </Text>

                <View className="items-center w-full">
                  {Platform.OS === "web" ? (
                    React.createElement("input", {
                      type: "color",
                      value: primaryColor,
                      onChange: (e: any) =>
                        onColorComplete({ hex: e.target.value }),
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
                    <View className="flex-row items-center gap-4 w-full">
                      <View className="w-8 h-8 rounded-full border-[3px] border-card" style={{ backgroundColor: primaryColor }} />
                      <Pressable 
                        onPress={() => setIsColorPickerVisible(true)}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                        })}
                        className="flex-1 bg-secondary rounded-lg px-3 py-2.5 border border-border items-center justify-center"
                      >
                        <Text className="text-foreground font-poppins-semibold text-xs">
                          Seleccionar Color
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Security Section */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            className="mb-4"
          >
            <View className="mb-4">
              <Text className="text-xl font-poppins-bold text-foreground mb-0.5 tracking-tight">
                Seguridad
              </Text>
              <Text className="text-muted-foreground font-poppins-medium text-xs">
                Protege el acceso a tu cuenta.
              </Text>
            </View>

            <View className="bg-card rounded-[20px] border border-border overflow-hidden mb-3">
              {hasHardware && Platform.OS !== "web" && (
                <>
                  <View className="flex-row items-center justify-between px-4 py-3">
                    <View className="flex-1 mr-4">
                      <Text className="text-sm font-poppins-semibold text-foreground">
                        Acceso Biométrico
                      </Text>
                      <Text className="text-[11px] font-poppins text-muted-foreground mt-0.5">
                        Usa FaceID o Huella para iniciar sesión rápidamente.
                      </Text>
                    </View>
                    <Switch
                      value={isBiometricEnabled}
                      onValueChange={toggleBiometric}
                      trackColor={{ false: "#71717a", true: primaryColor }}
                    />
                  </View>
                  <View className="h-[1px] bg-border mx-4" />
                </>
              )}

              <Pressable
                onPress={() => setPinModalVisible(true)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                })}
                className="flex-row items-center bg-secondary py-2.5 px-3.5 rounded-xl"
              >
                <View className="flex-1">
                  <Text className="text-sm font-poppins-semibold text-foreground">
                    Cambiar PIN
                  </Text>
                  <Text className="text-[11px] font-poppins text-muted-foreground mt-0.5">
                    Actualiza tu código de acceso de 6 dígitos.
                  </Text>
                </View>
                <View className="bg-secondary p-1.5 rounded-full">
                  <Icon
                    as={CloudUploadIcon}
                    size={14}
                    className="text-muted-foreground"
                  />
                </View>
              </Pressable>
            </View>
          </Animated.View>

          {/* System Section */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200).springify()}
            className="mb-4"
          >
            <View className="mb-4">
              <Text className="text-xl font-poppins-bold text-foreground mb-0.5 tracking-tight">
                Sistema
              </Text>
              <Text className="text-muted-foreground font-poppins-medium text-xs">
                Estado del servidor y conectividad.
              </Text>
            </View>

            <HealthCard />
          </Animated.View>

        </ScrollView>
      </View>

      <ChangePinModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        oldPin={oldPin}
        onOldPinChange={setOldPin}
        newPin={newPin}
        onNewPinChange={setNewPin}
        confirmPin={confirmPin}
        onConfirmPinChange={setConfirmPin}
        isChanging={isChangingPin}
        primaryColor={primaryColor}
        onChange={handleChangePin}
      />

      <BioSetupModal
        visible={bioSetupModalVisible}
        onClose={() => setBioSetupModalVisible(false)}
        pin={bioSetupPin}
        onPinChange={setBioSetupPin}
        isActivating={isActivatingBio}
        primaryColor={primaryColor}
        onConfirm={handleConfirmBioSetup}
      />

      <ColorPickerModal
        visible={isColorPickerVisible}
        onClose={() => setIsColorPickerVisible(false)}
        primaryColor={primaryColor}
        onColorComplete={onColorComplete}
      />
    </>
  );
}
