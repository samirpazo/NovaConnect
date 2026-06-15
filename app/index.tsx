import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { api } from "@/lib/axios";
import { hashPassword } from "@/lib/security";
import { storage } from "@/lib/storage";
import { showToast } from "@/lib/toast";
import { authService } from "@/services/authService";
import { secCollaboratorPreferenceService } from "@/services/secCollaboratorPreferenceService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Link, Stack, router, useFocusEffect } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import * as SplashScreen from "expo-splash-screen";
import { genParameterService, HelpData } from "@/services/genParameterService";
import { Image } from "expo-image";
import {
  ArrowRight,
  ChevronLeft,
  Delete,
  Fingerprint,
  Headset,
  IdCard,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react-native";
import * as React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

export default function LoginScreen() {
  const { login, isAuthenticating } = useAuthStore();
  const { setPreferences } = usePreferenceStore();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [PrsDocumentNumber, setPrsDocumentNumber] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [shuffledNumbers, setShuffledNumbers] = React.useState<number[]>([]);

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

    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    setShuffledNumbers([...numbers].sort(() => Math.random() - 0.5));

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
        console.error("Error initializing auth state", e);
      }
    })();
  }, []);

  const keypadItems = React.useMemo(() => {
    if (shuffledNumbers.length === 0) return [];
    return [...shuffledNumbers.slice(0, 9), "bio", shuffledNumbers[9], "del"];
  }, [shuffledNumbers]);

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
    width: "100%",
    maxWidth: 360,
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
              scheduleOnRN(() => {
                setStep(2);
                translateX.value = 50;
                opacity.value = withTiming(1, { duration: 200 });
                translateX.value = withTiming(0, { duration: 200 });
              });
            }
          });
        } else {
          // Vínculo válido, pero sin cuenta: mostrar alerta
          showToast.error("Cuenta no creada", "Aún no tienes una contraseña. Presiona 'Regístrate aquí' para crearla.");
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
        scheduleOnRN(() => {
          setStep(1);
          translateX.value = -50;
          opacity.value = withTiming(1, { duration: 200 });
          translateX.value = withTiming(0, { duration: 200 });
        });
      }
    });
  };

  const handleBack = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateX.value = withTiming(50, { duration: 200 }, (finished) => {
      if (finished) {
        scheduleOnRN(setStep, 1);
        scheduleOnRN(setPin, "");
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
          (pref.Theme as any) || "system",
          pref.PrimaryColor || "#002aff",
        );
      }
    } catch (e) {}
    router.replace("/(protected)/home");
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
      console.log("Biometric auth cancelled or failed", e);
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

  const handlePinPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
    }
  };

  const handleDeletePin = () => {
    setPin((prev) => prev.slice(0, -1));
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
            <View className="w-full flex-row justify-between items-start mb-2 min-h-[44px]">
              <View className="flex-1 items-start">
                {step === 2 && !hasStoredDocument && (
                  <Pressable onPress={handleBack} className="p-2 -ml-2">
                    <ChevronLeft size={28} className="text-muted-foreground" />
                  </Pressable>
                )}
              </View>

              <View className="flex-1 items-end">
                <Pressable
                  onPress={() => setShowHelpModal(true)}
                  className="flex-row items-center bg-primary/10 px-4 py-2 rounded-full"
                >
                  <Icon as={Headset} size={16} className="text-primary mr-2" />
                  <Text className="text-foreground font-poppins font-medium text-sm">
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
                    source={require("@/assets/images/logo-nova.svg")}
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

              <Animated.View style={animatedStyle}>
                {step === 1 ? (
                  <View className="w-full">
                    {/* Card Wrapper */}
                    <View className="bg-card w-full rounded-2xl p-5 shadow-sm dark:shadow-xl">
                      <Text className="text-card-foreground font-bold font-poppins text-sm mb-3">
                        Documento de Identidad
                      </Text>

                      {/* Input Field */}
                      <View className="flex-row items-center bg-secondary rounded-xl px-4 h-12 border border-border gap-3">
                        <IdCard
                          size={18}
                          color="#94a3b8"
                        />
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

                      <Text className="text-muted-foreground text-[11px] font-poppins mt-2 mb-4">
                        Ingresa tu documento de identidad
                      </Text>

                      {/* Wide Action Button */}
                      <Pressable
                        onPress={handleNextStep}
                        disabled={PrsDocumentNumber.length < 8}
                        className={`w-full h-12 rounded-xl flex-row items-center justify-center gap-2 ${PrsDocumentNumber.length >= 8 ? "bg-primary" : "bg-secondary"}`}
                      >
                        <Text
                          className={`font-bold font-poppins text-base ${PrsDocumentNumber.length >= 8 ? "text-primary-foreground" : "text-muted-foreground"}`}
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
                        <Text className="text-primary font-bold font-poppins text-sm">
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
                        source={require("@/assets/images/logo-nova.svg")}
                        style={{ width: 64, height: 64 }}
                        contentFit="contain"
                      />
                    </View>

                    <Text className="text-2xl font-bold font-poppins text-center text-foreground mb-1">
                      Ingresa tu PIN
                    </Text>

                    <View className="flex-row items-center justify-center gap-3 mb-6">
                      <Text className="text-sm font-poppins text-muted-foreground select-none">
                        Documento :{" "}
                        {"*".repeat(Math.max(0, PrsDocumentNumber.length - 4))}
                        {PrsDocumentNumber.slice(-4)}
                      </Text>
                      <Pressable
                        onPress={() => setShowConfirmLogoutModal(true)}
                        className="flex-row items-center bg-secondary/80 px-3 py-1.5 rounded-full active:bg-secondary"
                      >
                        <LogOut
                          size={14}
                          className="text-muted-foreground mr-1.5"
                        />
                        <Text className="text-xs font-poppins font-medium text-muted-foreground select-none">
                          Cambiar
                        </Text>
                      </Pressable>
                    </View>

                    {/* Card Wrapper for PIN */}
                    <View className="bg-card w-full max-w-[300px] mt-2 self-center rounded-3xl p-6 shadow-sm dark:shadow-xl">
                      {/* PIN Dots */}
                      <View className="flex-row gap-3 mb-6 justify-center">
                        {[...Array(6)].map((_, i) => (
                          <View
                            key={i}
                            className={`size-3 rounded-full ${i < pin.length ? "bg-primary" : "bg-muted"}`}
                          />
                        ))}
                      </View>

                      {/* Keypad */}
                      <View className="w-full flex-row flex-wrap justify-center gap-3 mb-5">
                        {keypadItems.map((item, i) => (
                          <Pressable
                            key={i}
                            onPress={() => {
                              if (item === "del") handleDeletePin();
                              else if (item === "bio") {
                                if (isBiometricEnabled) {
                                  handleBiometricAuth();
                                } else {
                                  setShowBiometricModal(true);
                                }
                              } else handlePinPress(item.toString());
                            }}
                            disabled={item === "bio" && !isBiometricSupported}
                            className={`w-[30%] h-10 items-center justify-center rounded-lg ${item !== "bio" ? "bg-secondary active:bg-muted" : ""} ${item === "bio" && !isBiometricSupported ? "opacity-0" : ""}`}
                          >
                            {item === "del" ? (
                              <Delete
                                size={20}
                                className="text-muted-foreground"
                              />
                            ) : item === "bio" ? (
                              isBiometricSupported ? (
                                <Fingerprint
                                  size={24}
                                  className={
                                    isBiometricEnabled
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }
                                />
                              ) : null
                            ) : (
                              <Text className="text-xl font-bold text-foreground font-poppins select-none">
                                {item}
                              </Text>
                            )}
                          </Pressable>
                        ))}
                      </View>

                      <Pressable
                        onPress={handleLogin}
                        disabled={isAuthenticating || pin.length < 6}
                        className={`w-full h-10 rounded-xl flex-row items-center justify-center gap-2 ${pin.length >= 6 ? "bg-primary" : "bg-muted opacity-60"}`}
                      >
                        <ShieldCheck
                          size={18}
                          color={pin.length >= 6 ? "#ffffff" : "#94a3b8"}
                        />
                        <Text
                          className={`font-bold select-none font-poppins text-base ${pin.length >= 6 ? "text-primary-foreground" : "text-muted-foreground"}`}
                        >
                          {isAuthenticating ? "Cargando..." : "Acceder"}
                        </Text>
                      </Pressable>
                    </View>

                    {/* Footer Links */}
                    <View className="mt-8 flex-row justify-center items-center">
                      <Text className="text-muted-foreground font-poppins text-sm select-none">
                        ¿Olvidaste tu PIN?{" "}
                      </Text>
                      <Pressable>
                        <Text className="text-primary font-bold font-poppins text-sm select-none">
                          Recuperar
                        </Text>
                      </Pressable>
                    </View>
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
        {/* Confirm Logout Modal */}
        <Modal
          visible={showConfirmLogoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmLogoutModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-center items-center bg-black/50 p-6"
          >
            <View className="bg-card w-full max-w-[320px] rounded-3xl p-6 shadow-xl relative">
              <View className="items-center mb-4 mt-2">
                <View className="w-12 h-12 rounded-full bg-destructive/10 items-center justify-center mb-3">
                  <LogOut size={24} className="text-destructive" />
                </View>
                <Text className="text-xl font-bold text-foreground font-poppins text-center">
                  Eliminar Registro
                </Text>
                <Text className="text-sm text-muted-foreground font-poppins text-center mt-3">
                  ¿Estás seguro de que deseas eliminar este documento guardado y
                  usar otro diferente?
                </Text>
              </View>

              <View className="flex-row items-center justify-between gap-3 mt-4">
                <Pressable
                  onPress={() => setShowConfirmLogoutModal(false)}
                  className="flex-1 h-12 rounded-xl flex-row items-center justify-center bg-secondary"
                >
                  <Text className="font-bold font-poppins text-base text-foreground">
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleForgetDocument}
                  className="flex-1 h-12 rounded-xl flex-row items-center justify-center bg-destructive"
                >
                  <Text className="font-bold font-poppins text-base text-foreground">
                    Sí, Eliminar
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Register Modal */}
        <Modal
          visible={showRegisterModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRegisterModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-center items-center bg-black/50 p-6"
          >
            <View className="bg-card w-full max-w-sm rounded-3xl p-6 items-center shadow-xl">
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                <IdCard size={32} color="#002aff" />
              </View>
              <Text className="text-xl font-bold font-poppins text-foreground text-center mb-2">
                Validar Documento
              </Text>
              <Text className="text-muted-foreground text-center mb-6 px-2 text-sm font-poppins">
                Ingresa tu documento para verificar si tienes un contrato activo y
                proceder con el registro.
              </Text>
              <View className="w-full mb-6">
                <Input
                  value={registerDoc}
                  onChangeText={(text) => {
                    setRegisterDoc(text);
                    if (registerError) setRegisterError("");
                  }}
                  placeholder="Número de documento"
                  keyboardType="number-pad"
                  maxLength={20}
                  className={`w-full h-12 bg-muted/50 rounded-xl text-center text-lg font-bold font-poppins ${registerError ? "border border-destructive" : "border-transparent"}`}
                />
                {registerError ? (
                  <Text className="text-destructive text-sm font-poppins text-center mt-2">
                    {registerError}
                  </Text>
                ) : null}
              </View>
              <View className="flex-row gap-3 w-full">
                <Button
                  variant="outline"
                  onPress={() => {
                    setShowRegisterModal(false);
                    setRegisterDoc("");
                    setRegisterError("");
                  }}
                  className="flex-1 h-12 rounded-xl"
                  disabled={isRegistering}
                >
                  <Text className="text-foreground font-poppins text-base font-medium">
                    Cancelar
                  </Text>
                </Button>
                <Button
                  onPress={handleValidateRegistration}
                  className="flex-1 h-12 rounded-xl bg-primary"
                  disabled={isRegistering || registerDoc.length < 8}
                >
                  <Text className="text-primary-foreground font-poppins text-base font-bold">
                    {isRegistering ? "Validando..." : "Validar"}
                  </Text>
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Help Modal */}
        <Modal
          visible={showHelpModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowHelpModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-center items-center bg-black/50 p-6"
          >
            <View className="bg-card w-full max-w-[320px] rounded-3xl p-6 shadow-xl relative">
              <Pressable
                onPress={() => setShowHelpModal(false)}
                className="absolute top-4 right-4 p-2 z-10"
              >
                <X size={20} className="text-muted-foreground" />
              </Pressable>

              <View className="items-center mb-4 mt-2">
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                  <Headset size={24} className="text-primary" />
                </View>
                <Text className="text-xl font-bold text-foreground font-poppins">
                  Centro de Ayuda
                </Text>
                <Text className="text-sm text-muted-foreground font-poppins text-center mt-3 mb-2">
                  Si tienes problemas para acceder a tu cuenta, por favor
                  comunícate con tu administrador o contáctanos:
                </Text>

                {helpData ? (
                  <View className="w-full mt-2">
                    {helpData.emails?.map((email, idx) => (
                      <View
                        key={`email-${idx}`}
                        className="flex-row items-center justify-center mb-2"
                      >
                        <Mail size={14} className="text-primary mr-2" />
                        <Text className="text-sm font-bold text-primary font-poppins text-center">
                          {email}
                        </Text>
                      </View>
                    ))}
                    {helpData.phones?.map((phone, idx) => (
                      <View
                        key={`phone-${idx}`}
                        className="flex-row items-center justify-center mb-1"
                      >
                        <Phone size={14} className="text-primary mr-2" />
                        <Text className="text-sm font-bold text-primary font-poppins text-center">
                          {phone}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-sm font-bold text-primary font-poppins text-center mt-2">
                    Cargando información...
                  </Text>
                )}
              </View>

              <Pressable
                onPress={() => setShowHelpModal(false)}
                className="w-full h-12 rounded-xl flex-row items-center justify-center bg-secondary mt-2"
              >
                <Text className="font-bold font-poppins text-base text-foreground">
                  Entendido
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>

      {/* Biometric Setup Modal */}
      <Modal visible={showBiometricModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center items-center bg-black/50 p-6"
        >
          <View className="bg-card w-full max-w-[320px] rounded-3xl p-6 shadow-xl relative">
            <Pressable
              onPress={() => setShowBiometricModal(false)}
              className="absolute top-4 right-4 p-2 z-10"
            >
              <X size={20} className="text-muted-foreground" />
            </Pressable>

            <View className="items-center mb-4 mt-2">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                <Fingerprint size={24} className="text-primary" />
              </View>
              <Text className="text-xl font-bold text-foreground font-poppins text-center">
                Activar Biometría
              </Text>
              <Text className="text-sm text-muted-foreground font-poppins text-center mt-2">
                Ingresa tu PIN para vincular tu huella o rostro y usarlo la
                próxima vez.
              </Text>
            </View>

            <TextInput
              secureTextEntry
              autoFocus
              keyboardType="numeric"
              maxLength={6}
              value={biometricSetupPin}
              onChangeText={setBiometricSetupPin}
              placeholder="Tu PIN"
              placeholderTextColor="#94a3b8"
              style={{ outlineStyle: "none" } as any}
              className="w-full h-12 bg-secondary rounded-xl px-4 text-center text-foreground font-poppins text-lg tracking-widest mb-6"
            />

            <Pressable
              onPress={handleBiometricSetupSubmit}
              disabled={isAuthenticating || biometricSetupPin.length < 4}
              className={`w-full h-12 rounded-xl flex-row items-center justify-center ${biometricSetupPin.length >= 4 ? "bg-primary" : "bg-muted opacity-60"}`}
            >
              <Text
                className={`font-bold font-poppins text-base ${biometricSetupPin.length >= 4 ? "text-primary-foreground" : "text-muted-foreground"}`}
              >
                {isAuthenticating ? "Activando..." : "Confirmar"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
