import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PinKeypad } from "@/components/ui/pin-keypad";
import { OtpInput } from "@/components/ui/otp-input";
import { Text } from "@/components/ui/text";
import { hashPassword } from "@/lib/security";
import { storage } from "@/lib/storage";
import { showToast } from "@/lib/toast";
import { authService } from "@/services/authService";
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
  X,
  Fingerprint,
  ScanFace,
  ChevronLeft,
} from "lucide-react-native";
import { router } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
  KeyboardAvoidingView,
  TextInput,
  InteractionManager,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { FadeInDown, runOnJS } from "react-native-reanimated";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor || "#002aff";

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
      secCollaboratorPreferenceService.savePreferences({ Theme: theme, PrimaryColor: hex }).catch(() => {});
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
        <View className="flex-row items-center px-5 py-4 border-b border-border">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
            className="w-10 h-10 items-center justify-center rounded-full bg-secondary"
          >
            <ChevronLeft size={24} color={primaryColor} />
          </Pressable>
          <View className="flex-1 px-4">
            <Text className="text-xl font-poppins-semibold text-foreground">
              Configuración
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="px-5 pt-6"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 100, 100) }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            className="mb-6"
          >
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
              <View className="bg-secondary rounded-[20px] p-1 flex-row border border-border">
                {THEME_OPTIONS.map((option) => {
                  const isSelected = theme === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setTheme(option.value as any);
                        setStorePrimaryColor(primaryColor);
                        setTimeout(() => {
                          setPreferences(option.value as any, primaryColor);
                          secCollaboratorPreferenceService.savePreferences({ Theme: option.value as any, PrimaryColor: primaryColor }).catch(() => {});
                        }, 100);
                      }}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1,
                      })}
                      className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[16px] ${
                        isSelected
                          ? "bg-card border border-border"
                          : ""
                      }`}
                    >
                      <Icon
                        as={option.icon}
                        size={16}
                        color={isSelected ? primaryColor : undefined}
                        className={
                          isSelected
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      />
                      <Text
                        className={`text-xs font-poppins-bold ${
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
            <View className="mb-6">
              <View className="flex-row items-center mb-3 px-1">
                <Palette size={18} className="text-foreground mr-2" />
                <Text className="text-base font-poppins-bold text-foreground">
                  Color Principal
                </Text>
              </View>

              <View className="bg-card rounded-[24px] p-5 border border-border">
                <Text className="text-[10px] font-poppins-bold text-muted-foreground uppercase tracking-widest mb-3 text-center">
                  Predefinidos
                </Text>
                <View className="flex-row flex-wrap gap-3 justify-center mb-6">
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
                              secCollaboratorPreferenceService.savePreferences({ Theme: theme, PrimaryColor: color.value }).catch(() => {});
                            }, 100);
                          });
                        }}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                        })}
                        className="items-center justify-center"
                      >
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center"
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

                <View className="h-[1px] w-full bg-border mb-5" />

                <Text className="text-[10px] font-poppins-bold text-muted-foreground uppercase tracking-widest mb-4 text-center">
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
                      <View className="w-12 h-12 rounded-full border-[3px] border-card" style={{ backgroundColor: primaryColor }} />
                      <Pressable 
                        onPress={() => setIsColorPickerVisible(true)}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                        })}
                        className="flex-1 bg-secondary rounded-xl px-4 py-3 border border-border items-center justify-center"
                      >
                        <Text className="text-foreground font-poppins-semibold">
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
            className="mb-6"
          >
            <View className="mb-6">
              <Text className="text-2xl font-poppins-bold text-foreground mb-1 tracking-tight">
                Seguridad
              </Text>
              <Text className="text-muted-foreground font-poppins-medium text-sm">
                Protege el acceso a tu cuenta.
              </Text>
            </View>

            <View className="bg-card rounded-[24px] border border-border overflow-hidden mb-4">
              {hasHardware && Platform.OS !== "web" && (
                <>
                  <View className="flex-row items-center justify-between px-5 py-4">
                    <View className="flex-1 mr-4">
                      <Text className="text-base font-poppins-semibold text-foreground">
                        Acceso Biométrico
                      </Text>
                      <Text className="text-[12px] font-poppins text-muted-foreground mt-0.5">
                        Usa FaceID o Huella para iniciar sesión rápidamente.
                      </Text>
                    </View>
                    <Switch
                      value={isBiometricEnabled}
                      onValueChange={toggleBiometric}
                      trackColor={{ false: "#71717a", true: primaryColor }}
                    />
                  </View>
                  <View className="h-[1px] bg-border mx-5" />
                </>
              )}

              <Pressable
                onPress={() => setPinModalVisible(true)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                })}
                className="flex-row items-center bg-secondary py-3 px-4 rounded-xl"
              >
                <View className="flex-1">
                  <Text className="text-base font-poppins-semibold text-foreground">
                    Cambiar PIN
                  </Text>
                  <Text className="text-[12px] font-poppins text-muted-foreground mt-0.5">
                    Actualiza tu código de acceso de 6 dígitos.
                  </Text>
                </View>
                <View className="bg-secondary p-2 rounded-full">
                  <Icon
                    as={CloudUploadIcon}
                    size={16}
                    className="text-muted-foreground"
                  />
                </View>
              </Pressable>
            </View>
          </Animated.View>


        </ScrollView>
      </View>

      {/* Change PIN Modal */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isChangingPin && setPinModalVisible(false)}
      >
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="w-full max-w-sm bg-card rounded-[24px] p-6 border border-border">
            <Text className="text-xl font-poppins-bold text-foreground mb-1">
              Cambiar PIN
            </Text>
            <Text className="text-sm font-poppins text-muted-foreground mb-6">
              Ingresa tu PIN actual y el nuevo código de 6 dígitos.
            </Text>

            <View className="gap-4 mb-8">
              <View>
                <Text className="text-[12px] font-poppins-medium text-foreground mb-2 ml-1">
                  PIN Actual
                </Text>
                <OtpInput
                  value={oldPin}
                  onChangeText={setOldPin}
                  secureTextEntry
                />
              </View>
              <View>
                <Text className="text-[12px] font-poppins-medium text-foreground mb-2 ml-1">
                  Nuevo PIN
                </Text>
                <OtpInput
                  value={newPin}
                  onChangeText={setNewPin}
                  secureTextEntry
                />
              </View>
              <View>
                <Text className="text-[12px] font-poppins-medium text-foreground mb-2 ml-1">
                  Confirmar Nuevo PIN
                </Text>
                <OtpInput
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  secureTextEntry
                />
              </View>
            </View>

            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                onPress={() => setPinModalVisible(false)}
                disabled={isChangingPin}
                className="px-6 h-12"
              >
                <Text>Cancelar</Text>
              </Button>
              <Button
                onPress={handleChangePin}
                disabled={
                  isChangingPin ||
                  oldPin.length < 6 ||
                  newPin.length < 6 ||
                  confirmPin.length < 6
                }
                className="px-6 h-12"
                style={{
                  backgroundColor:
                    newPin.length >= 6 ? primaryColor : undefined,
                }}
              >
                <Text className="font-poppins-bold text-white">
                  {isChangingPin ? "Guardando..." : "Cambiar"}
                </Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Biometric Setup Modal */}
      <Modal visible={bioSetupModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center items-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="bg-card w-full max-w-[320px] rounded-[24px] p-6 relative border border-border">
            <Pressable
              onPress={() => setBioSetupModalVisible(false)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
              className="absolute top-4 right-4 p-2 z-10"
            >
              <X size={20} className="text-muted-foreground" />
            </Pressable>

            <View className="items-center mb-4 mt-2">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                {Platform.OS === "ios" ? (
                  <ScanFace size={24} color={primaryColor} />
                ) : (
                  <Fingerprint size={24} color={primaryColor} />
                )}
              </View>
              <Text className="text-xl font-poppins-bold text-foreground text-center">
                Activar Biometría
              </Text>
              <Text className="text-sm text-muted-foreground font-poppins text-center mt-2">
                Ingresa tu PIN para confirmar tu identidad.
              </Text>
            </View>

            <View className="mb-6 mt-4">
              <PinKeypad
                pin={bioSetupPin}
                onPinChange={setBioSetupPin}
                primaryColor={primaryColor}
                maxLength={6}
              />
            </View>

            <Pressable
              onPress={handleConfirmBioSetup}
              disabled={isActivatingBio || bioSetupPin.length < 4}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
              className={`w-full h-12 rounded-[16px] flex-row items-center justify-center ${bioSetupPin.length >= 4 ? "bg-primary" : "bg-muted opacity-60"}`}
            >
              <Text
                className={`font-poppins-bold text-base ${bioSetupPin.length >= 4 ? "text-primary-foreground" : "text-muted-foreground"}`}
              >
                {isActivatingBio ? "Activando..." : "Confirmar"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Color Picker Modal */}
      <Modal
        visible={isColorPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsColorPickerVisible(false)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View
            className="flex-1 justify-center items-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <View className="w-full max-w-sm bg-card rounded-[24px] p-6 border border-border">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-poppins-bold text-foreground">
                  Elige un color
                </Text>
                <Pressable
                  onPress={() => setIsColorPickerVisible(false)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                  className="p-2 bg-secondary rounded-full"
                >
                  <X size={20} className="text-foreground" />
                </Pressable>
              </View>

              <ColorPicker
                style={{ width: "100%", gap: 20 }}
                value={primaryColor}
                onComplete={onColorComplete}
              >
                <Panel1 style={{ height: 200, borderRadius: 16 }} />
                <HueSlider style={{ borderRadius: 12, height: 28 }} />
              </ColorPicker>

              <Button
                className="w-full mt-8"
                variant="default"
                onPress={() => setIsColorPickerVisible(false)}
                style={{ backgroundColor: primaryColor }}
              >
                <Text className="text-white font-poppins-semibold text-base">
                  Aceptar
                </Text>
              </Button>
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}
