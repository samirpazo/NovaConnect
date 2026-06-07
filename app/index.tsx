import { Text } from "@/components/ui/text";
import { hashPassword } from "@/lib/security";
import { secCollaboratorPreferenceService } from "@/services/secCollaboratorPreferenceService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";
import {
  ArrowRight,
  ChevronLeft,
  Delete,
  Headset,
  IdCard,
  ShieldCheck,
  User,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

export default function LoginScreen() {
  const { login, isAuthenticating } = useAuthStore();
  const { setPreferences } = usePreferenceStore();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [PrsDocumentNumber, setPrsDocumentNumber] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [shuffledNumbers, setShuffledNumbers] = React.useState<number[]>([]);

  React.useEffect(() => {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    setShuffledNumbers([...numbers].sort(() => Math.random() - 0.5));
  }, []);

  const keypadItems = React.useMemo(() => {
    if (shuffledNumbers.length === 0) return [];
    return [...shuffledNumbers.slice(0, 9), "", shuffledNumbers[9], "del"];
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

  const handleNextStep = () => {
    if (!PrsDocumentNumber || PrsDocumentNumber.length < 8) {
      Alert.alert("Error", "Ingrese un documento válido.");
      return;
    }

    opacity.value = withTiming(0, { duration: 200 });
    translateX.value = withTiming(-50, { duration: 200 }, (finished) => {
      if (finished) {
        scheduleOnRN(setStep, 2);
        translateX.value = 50;
        opacity.value = withTiming(1, { duration: 200 });
        translateX.value = withTiming(0, { duration: 200 });
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
    } else {
      Alert.alert(
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
                {step === 2 && (
                  <Pressable onPress={handleBack} className="p-2 -ml-2">
                    <ChevronLeft size={28} className="text-muted-foreground" />
                  </Pressable>
                )}
              </View>
              
              <View className="flex-1 items-end">
                <Pressable className="flex-row items-center bg-primary/10 px-4 py-2 rounded-full">
                  <Headset size={16} className="text-primary mr-2" />
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
                  <View className="flex-row items-center bg-secondary rounded-xl px-3 h-12 border border-border">
                    <IdCard size={18} className="text-muted-foreground mr-2" />
                    <TextInput
                      placeholder="Tu Documento"
                      placeholderTextColor="#94a3b8"
                      value={PrsDocumentNumber}
                      onChangeText={setPrsDocumentNumber}
                      keyboardType="numeric"
                      style={{ outlineStyle: "none" } as any}
                      className="flex-1 text-foreground font-poppins text-base bg-transparent h-full"
                    />
                  </View>

                  <Text className="text-muted-foreground text-[11px] font-poppins mt-2 mb-4">
                    Ingresa tu documento de identidad
                  </Text>

                  {/* Wide Action Button */}
                  <Pressable
                    onPress={handleNextStep}
                    disabled={PrsDocumentNumber.length < 8}
                    className={`w-full h-12 rounded-xl flex-row items-center justify-center gap-2 ${PrsDocumentNumber.length >= 8 ? "bg-primary shadow-sm shadow-primary/20" : "bg-secondary"}`}
                  >
                    <Text
                      className={`font-bold font-poppins text-base ${PrsDocumentNumber.length >= 8 ? "text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      Continuar
                    </Text>
                    <ArrowRight
                      size={18}
                      color={PrsDocumentNumber.length >= 8 ? "#ffffff" : "#94a3b8"}
                    />
                  </Pressable>
                </View>

                {/* Register Link */}
                <View className="mt-8 flex-row justify-center items-center">
                  <Text className="text-muted-foreground font-poppins text-sm">
                    ¿No tienes una cuenta?{" "}
                  </Text>
                  <Pressable onPress={() => router.push("/register" as any)}>
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

                <Text className="text-sm font-poppins text-muted-foreground mb-6">
                  Documento : ****{PrsDocumentNumber.slice(-4) || "****"}
                </Text>

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
                          else if (item !== "") handlePinPress(item.toString());
                        }}
                        disabled={item === ""}
                        className={`w-[30%] h-10 items-center justify-center rounded-lg ${item !== "" ? "bg-secondary active:bg-muted" : ""}`}
                      >
                        {item === "del" ? (
                          <Delete size={20} className="text-muted-foreground" />
                        ) : item !== "" ? (
                        <Text className="text-xl font-bold text-foreground font-poppins select-none">
                          {item}
                        </Text>
                        ) : null}
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    onPress={handleLogin}
                    disabled={isAuthenticating || pin.length < 4}
                    className={`w-full h-12 rounded-xl flex-row items-center justify-center gap-2 ${pin.length >= 4 ? "bg-primary" : "bg-muted opacity-60"}`}
                  >
                    <ShieldCheck
                      size={18}
                      color={pin.length >= 4 ? "#ffffff" : "#94a3b8"}
                    />
                    <Text
                      className={`font-bold font-poppins text-base ${pin.length >= 4 ? "text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      {isAuthenticating ? "Cargando..." : "Acceder"}
                    </Text>
                  </Pressable>
                </View>

                {/* Footer Links */}
                <View className="mt-8 flex-row justify-center items-center">
                  <Text className="text-muted-foreground font-poppins text-sm">
                    ¿Olvidaste tu PIN?{" "}
                  </Text>
                  <Pressable>
                    <Text className="text-primary font-bold font-poppins text-sm">
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
      </SafeAreaView>
    </>
  );
}
