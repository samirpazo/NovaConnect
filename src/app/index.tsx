import { BiometricModal } from "@/components/login/BiometricModal";
import { ConfirmLogoutModal } from "@/components/login/ConfirmLogoutModal";
import { HelpModal } from "@/components/login/HelpModal";
import { RegisterModal } from "@/components/login/RegisterModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinKeypad } from "@/components/ui/pin-keypad";
import { Text } from "@/components/ui/text";
import { sanitizePrimaryColor } from "@/lib/colorUtils";
import { logger } from "@/lib/logger";
import { hashPassword } from "@/lib/security";
import { storage } from "@/lib/storage";
import { showToast } from "@/lib/toast";
import { authService } from "@/services/authService";
import { genParameterService, HelpData } from "@/services/genParameterService";
import { secCollaboratorPreferenceService } from "@/services/secCollaboratorPreferenceService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Image } from "expo-image";
import * as LocalAuthentication from "expo-local-authentication";
import { router, Stack } from "expo-router";
import {
  ArrowRight,
  ChevronLeft,
  Delete,
  Headset,
  IdCard,
  LogOut,
  ShieldCheck,
} from "lucide-react-native";
import * as React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { login, isAuthenticating, user, pinLocked, unlock } = useAuthStore();
  const { setPreferences, primaryColor: storePrimaryColor } =
    usePreferenceStore();
  const primaryColor = sanitizePrimaryColor(storePrimaryColor);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [PrsDocumentNumber, setPrsDocumentNumber] = React.useState("");
  const [pin, setPin] = React.useState("");

  const [isBiometricSupported, setIsBiometricSupported] = React.useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = React.useState(false);
  const [showBiometricModal, setShowBiometricModal] = React.useState(false);
  const [showHelpModal, setShowHelpModal] = React.useState(false);
  const [showConfirmLogoutModal, setShowConfirmLogoutModal] =
    React.useState(false);
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);
  const [registerDoc, setRegisterDoc] = React.useState("");
  const [registerError, setRegisterError] = React.useState("");
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [helpData, setHelpData] = React.useState<HelpData | null>(null);
  const [biometricSetupPin, setBiometricSetupPin] = React.useState("");
  const [hasStoredDocument, setHasStoredDocument] = React.useState(false);

  React.useEffect(() => {
    genParameterService.getHelpInfo().then((data) => {
      if (data) {
        setHelpData(data);
      }
    });

    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (compatible && enrolled && Platform.OS !== "web") {
          setIsBiometricSupported(true);
        }

        const savedDoc = await storage.getItem("savedDocumentNumber");
        const bioEnabled = await storage.getItem("isBiometricEnabled");

        if (bioEnabled === "true") {
          setIsBiometricEnabled(true);
        }

        if (savedDoc) {
          setHasStoredDocument(true);
          setPrsDocumentNumber(savedDoc);
          setStep(2);

          if (
            bioEnabled === "true" &&
            compatible &&
            enrolled &&
            Platform.OS !== "web"
          ) {
            setTimeout(() => {
              handleBiometricAuth(savedDoc);
            }, 500);
          }
        }
      } catch (e) {
        logger.error("Error initializing auth state", e);
      }
    })();
  }, []);

  // Cuando el usuario se restaura desde persistencia (recarga web),
  // mostrar pantalla de desbloqueo PIN
  React.useEffect(() => {
    if (pinLocked && user?.PrsDocumentNumber) {
      setHasStoredDocument(true);
      setPrsDocumentNumber(user.PrsDocumentNumber);
      setStep(2);
    }
  }, [pinLocked, user]);

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
    width: "100%",
    maxWidth: 300,
    alignItems: "center" as const,
  }));

  const handleNextStep = async () => {
    if (!PrsDocumentNumber || PrsDocumentNumber.length < 8) {
      showToast.warning("Documento inválido", "Ingrese un documento válido.");
      return;
    }

    try {
      const {
        success,
        data,
        error: errorMsg,
      } = await authService.validateLogin(PrsDocumentNumber);

      if (success && data) {
        if (data.HasAccount) {
          // Ya tiene cuenta: pasar a ingresar PIN
          opacity.value = withTiming(0, { duration: 200 });
          translateX.value = withTiming(-50, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(setStep)(2);
              translateX.value = 50;
              opacity.value = withTiming(1, { duration: 200 });
              translateX.value = withTiming(0, { duration: 200 });
            }
          });
        } else {
          // Vínculo válido, pero sin cuenta: mostrar alerta
          showToast.error(
            "Cuenta no creada",
            "Aún no tienes una contraseña. Presiona 'Regístrate aquí' para crearla.",
          );
        }
      } else {
        // No existe persona o no tiene contrato activo
        showToast.error(
          "Acceso denegado",
          errorMsg || "No se pudo validar el documento.",
        );
      }
    } catch (error) {
      showToast.error("Error", "Error de conexión al validar el documento.");
    }
  };

  const handleValidateRegistration = async () => {
    if (!registerDoc || registerDoc.length < 8) {
      setRegisterError("Ingrese un documento válido.");
      return;
    }
    setRegisterError("");
    setIsRegistering(true);
    const {
      success,
      data: validatedPrsId,
      error: errorMsg,
    } = await authService.validateRegistration(registerDoc);
    setIsRegistering(false);

    if (success && validatedPrsId) {
      setShowRegisterModal(false);
      setRegisterDoc(""); // reset
      setRegisterError(""); // reset
      router.push(`/register?doc=${registerDoc}&prsId=${validatedPrsId}`);
    } else {
      setRegisterError(
        errorMsg || "No cumples con los requisitos para registrarte.",
      );
    }
  };

  const handleForgetDocument = async () => {
    setShowConfirmLogoutModal(false);
    await storage.removeItem("savedDocumentNumber");
    await storage.removeItem("isBiometricEnabled");
    await storage.removeItem("savedHashedPin");
    setPrsDocumentNumber("");
    setPin("");
    setIsBiometricEnabled(false);
    setHasStoredDocument(false);

    opacity.value = withTiming(0, { duration: 200 });
    translateX.value = withTiming(50, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setStep)(1);
        translateX.value = -50;
        opacity.value = withTiming(1, { duration: 200 });
        translateX.value = withTiming(0, { duration: 200 });
      }
    });
  };

  const handleBack = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateX.value = withTiming(50, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setStep)(1);
        runOnJS(setPin)("");
        translateX.value = -50;
        opacity.value = withTiming(1, { duration: 200 });
        translateX.value = withTiming(0, { duration: 200 });
      }
    });
  };

  const processSuccessfulLogin = async () => {
    try {
      const pref = await secCollaboratorPreferenceService.getMyPreferences();
      if (pref) {
        setPreferences(
          (pref.Theme ?? "system") as "light" | "dark" | "system",
          pref.PrimaryColor || "#002aff",
        );
      }
    } catch (e) {
      logger.error("Failed to load user preferences from cloud:", e);
    }
  };

  const handleBiometricAuth = async (doc?: string) => {
    const documentToUse = doc || PrsDocumentNumber;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Inicia sesión con biometría",
        cancelLabel: "Cancelar",
        disableDeviceFallback: false,
      });

      if (result.success) {
        const savedHashedPin = await storage.getItem("savedHashedPin");
        if (savedHashedPin && documentToUse) {
          const loginResult = await login({
            DocumentNumber: documentToUse,
            Password: savedHashedPin,
          });

          if (loginResult.success) {
            processSuccessfulLogin();
          } else {
            showToast.error(
              "Error",
              loginResult.error || "Falló inicio sesión biométrico",
            );
          }
        }
      }
    } catch (e) {
      logger.log("Biometric auth cancelled or failed", e);
    }
  };

  const handleBiometricSetupSubmit = async () => {
    if (biometricSetupPin.length < 4) return;
    const hashedPassword = hashPassword(biometricSetupPin);

    const result = await login({
      DocumentNumber: PrsDocumentNumber,
      Password: hashedPassword,
    });

    if (result.success) {
      await storage.setItem("savedHashedPin", hashedPassword);
      await storage.setItem("isBiometricEnabled", "true");
      await storage.setItem("savedDocumentNumber", PrsDocumentNumber);
      setIsBiometricEnabled(true);
      setShowBiometricModal(false);
      processSuccessfulLogin();
    } else {
      showToast.error("Error", result.error || "PIN incorrecto");
      setBiometricSetupPin("");
    }
  };

  const handleLogin = async () => {
    if (!PrsDocumentNumber || pin.length < 4) {
      Alert.alert("Error", "Ingrese credenciales válidas.");
      return;
    }

    const hashedPassword = hashPassword(pin);

    const result = await login({
      DocumentNumber: PrsDocumentNumber,
      Password: hashedPassword,
    });

    if (result.success) {
      await storage.setItem("savedDocumentNumber", PrsDocumentNumber);
      processSuccessfulLogin();
    } else {
      showToast.error(
        "Error de autenticación",
        result.error || "PIN o documento incorrecto",
      );
      setPin(""); // Reset PIN on error
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView contentContainerClassName="flex-grow p-6">
            {/* Header Area */}
            <View className="w-full flex-row justify-between items-center mb-2 min-h-[44px] z-10">
              <View className="flex-1 items-start">
                {step === 2 && !hasStoredDocument && (
                  <Pressable onPress={handleBack} className="p-2 -ml-2">
                    <ChevronLeft size={28} className="text-muted-foreground" />
                  </Pressable>
                )}
              </View>

              <View className="items-end">
                <Pressable
                  onPress={() => setShowHelpModal(true)}
                  className="flex-row items-center bg-secondary/80 px-4 py-2 rounded-full active:bg-secondary"
                >
                  <Headset
                    size={16}
                    color={primaryColor || "#002aff"}
                  />
                  <Text className="text-sm font-poppins font-medium text-foreground ml-2">
                    Ayuda
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Main Content Area */}
            <View className="flex-1 justify-center items-center w-full">
              {/* Header - Only visible on Step 1 */}
              {step === 1 && (
                <View className="items-center mb-6 mt-8">
                  <Image
                    source={require("../../assets/images/logo-nova.svg")}
                    style={{ width: 80, height: 80 }}
                    contentFit="contain"
                    className="mb-4"
                  />
                  <Text className="text-3xl font-bold font-poppins text-foreground">
                    Nova Connect
                  </Text>
                  <Text className="text-base font-poppins text-muted-foreground mt-2">
                    Ingresa tu cuenta para continuar
                  </Text>
                </View>
              )}

              <Animated.View style={animatedStyle} className="w-full max-w-[360px]">
                {step === 1 ? (
                  <View className="w-full">
                    {/* Card Wrapper */}
                    <View className="bg-card w-full rounded-3xl p-5 border border-border/40 shadow-sm dark:shadow-xl">
                      <Text className="text-card-foreground font-poppins-semibold text-sm mb-3">
                        Documento de Identidad
                      </Text>

                      {/* Input Field */}
                      <View className="flex-row items-center bg-secondary/50 rounded-2xl px-4 h-12 border border-border/40 gap-3">
                        <IdCard size={18} color="#94a3b8" />
                        <TextInput
                          placeholder="00000000"
                          placeholderTextColor="#94a3b8"
                          value={PrsDocumentNumber}
                          onChangeText={setPrsDocumentNumber}
                          keyboardType="numeric"
                          style={{ outlineStyle: "none" } as any}
                          className="flex-1 text-foreground font-poppins text-base bg-transparent py-0"
                        />
                      </View>

                      <Text className="text-muted-foreground text-xs font-poppins mt-2 mb-4">
                        Ingresa tu documento de identidad
                      </Text>

                      {/* Wide Action Button */}
                      <Pressable
                        onPress={handleNextStep}
                        disabled={PrsDocumentNumber.length < 8}
                        className={`w-full h-12 rounded-2xl flex-row items-center justify-center gap-2 ${PrsDocumentNumber.length < 8 ? "bg-secondary" : ""}`}
                        style={
                          PrsDocumentNumber.length >= 8
                            ? { backgroundColor: primaryColor || "#002aff" }
                            : {}
                        }
                      >
                        <Text
                          className={`font-bold font-poppins text-base ${PrsDocumentNumber.length >= 8 ? "text-white" : "text-muted-foreground"}`}
                        >
                          Continuar
                        </Text>
                        <ArrowRight
                          size={18}
                          color={
                            PrsDocumentNumber.length >= 8
                              ? "#ffffff"
                              : "#94a3b8"
                          }
                        />
                      </Pressable>
                    </View>

                    {/* Register Link */}
                    <View className="mt-8 flex-row justify-center items-center">
                      <Text className="text-muted-foreground font-poppins text-sm">
                        ¿No tienes una cuenta?{" "}
                      </Text>
                      <Pressable onPress={() => setShowRegisterModal(true)}>
                        <Text
                          className="font-poppins font-bold text-sm"
                          style={{ color: primaryColor || "#002aff" }}
                        >
                          Regístrate aquí
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="w-full items-center">
                    {/* Logo Instead of User Icon */}
                    <View className="items-center justify-center mb-3">
                      <Image
                        source={require("../../assets/images/logo-nova.svg")}
                        style={{ width: 64, height: 64 }}
                        contentFit="contain"
                      />
                    </View>

                    <Text className="text-2xl font-bold font-poppins text-center text-foreground mb-1">
                      Ingresa tu PIN
                    </Text>

                    <View className="flex-row items-center justify-center gap-3 mb-6">
                      <Text className="text-sm font-poppins text-muted-foreground select-none">
                        {`Documento : ${"*".repeat(Math.max(0, PrsDocumentNumber.length - 4))}${PrsDocumentNumber.slice(-4)}`}
                      </Text>
                      {!pinLocked && (
                        <Pressable
                          onPress={() => setShowConfirmLogoutModal(true)}
                          className="flex-row items-center bg-secondary px-3.5 py-1.5 rounded-full active:bg-secondary/80 gap-1.5"
                        >
                          <LogOut
                            size={13}
                            color={primaryColor}
                          />
                          <Text 
                            style={{ color: primaryColor }}
                            className="text-xs font-poppins-bold select-none"
                          >
                            Cambiar
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Card Wrapper for PIN */}
                    <View className="bg-card w-full max-w-[300px] mt-2 self-center rounded-3xl p-5 border border-border/40 shadow-sm dark:shadow-xl">
                      {/* Keypad */}
                      <View className="w-full mb-5">
                        <PinKeypad
                          pin={pin}
                          onPinChange={setPin}
                          primaryColor={primaryColor || "#002aff"}
                          maxLength={6}
                          showBiometric={true}
                          isBiometricSupported={isBiometricSupported}
                          isBiometricEnabled={isBiometricEnabled}
                          onBiometric={() => {
                            if (isBiometricEnabled) {
                              handleBiometricAuth();
                            } else {
                              setShowBiometricModal(true);
                            }
                          }}
                        />
                      </View>

                      <Pressable
                        onPress={handleLogin}
                        disabled={isAuthenticating || pin.length < 6}
                        className={`w-full h-12 rounded-2xl flex-row items-center justify-center gap-2 ${pin.length < 6 ? "bg-muted opacity-60" : ""}`}
                        style={
                          pin.length >= 6
                            ? { backgroundColor: primaryColor || "#002aff" }
                            : {}
                        }
                      >
                        <ShieldCheck
                          size={18}
                          color={pin.length >= 6 ? "#ffffff" : "#94a3b8"}
                        />
                        <Text
                          className={`font-bold select-none font-poppins text-base ${pin.length >= 6 ? "text-white" : "text-muted-foreground"}`}
                        >
                          {isAuthenticating ? "Cargando..." : "Acceder"}
                        </Text>
                      </Pressable>
                    </View>

                    {/* Footer Links */}
                    {!pinLocked && (
                      <View className="mt-8 flex-row justify-center items-center">
                        <Text className="text-muted-foreground font-poppins text-sm select-none">
                          ¿Olvidaste tu PIN?{" "}
                        </Text>
                        <Pressable onPress={() => router.push({ pathname: "/recover", params: { document: PrsDocumentNumber } })}>
                          <Text
                            className="font-bold font-poppins text-sm select-none"
                            style={{ color: primaryColor || "#002aff" }}
                          >
                            Recuperar
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>
            </View>

            {/* Footer Area */}
            <View className="w-full items-center mt-8 pb-4">
              <Text className="text-muted-foreground font-poppins text-xs italic">
                Nova Connect 2026
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ConfirmLogoutModal
        visible={showConfirmLogoutModal}
        onClose={() => setShowConfirmLogoutModal(false)}
        onConfirm={handleForgetDocument}
      />

      <RegisterModal
        visible={showRegisterModal}
        onClose={() => { setShowRegisterModal(false); setRegisterDoc(""); setRegisterError(""); }}
        registerDoc={registerDoc}
        onRegisterDocChange={(text) => { setRegisterDoc(text); if (registerError) setRegisterError(""); }}
        registerError={registerError}
        isRegistering={isRegistering}
        primaryColor={primaryColor || "#002aff"}
        onValidate={handleValidateRegistration}
      />

      <HelpModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        primaryColor={primaryColor || "#002aff"}
        helpData={helpData}
      />

      <BiometricModal
        visible={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        pin={biometricSetupPin}
        onPinChange={setBiometricSetupPin}
        isAuthenticating={isAuthenticating}
        primaryColor={primaryColor || "#002aff"}
        onSubmit={handleBiometricSetupSubmit}
      />
    </>
  );
}
