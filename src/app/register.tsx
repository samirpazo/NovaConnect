import { Text } from "@/components/ui/text";
import { showToast } from "@/lib/toast";
import { hashPassword } from "@/lib/security";
import { storage } from "@/lib/storage";
import { authService } from "@/services/authService";
import { secCollaboratorPreferenceService } from "@/services/secCollaboratorPreferenceService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { PinKeypad } from "@/components/ui/pin-keypad";
import { ChevronLeft } from "lucide-react-native";
import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const { doc, prsId } = useLocalSearchParams();
  const { login } = useAuthStore();
  const { setPreferences, primaryColor: storePrimaryColor } =
    usePreferenceStore();
  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor;
  const [step, setStep] = React.useState<1 | 2>(1);
  const [firstPin, setFirstPin] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Parse prsId to number, since URL params are strings
  const parsedPrsId = prsId ? parseInt(prsId as string, 10) : null;

  React.useEffect(() => {
    if (!doc || !prsId) {
      setTimeout(() => {
        showToast.error("Acceso denegado", "Debes validar tu documento primero.");
        router.replace("/");
      }, 0);
    }
  }, [doc, prsId]);

  const handleContinue = () => {
    if (pin.length < 6) {
      showToast.error("Error", "El PIN debe tener 6 dígitos.");
      return;
    }
    setFirstPin(pin);
    setPin("");
    setStep(2);
  };

  const handleRegister = async () => {
    if (pin.length < 6) {
      showToast.error("Error", "El PIN debe tener 6 dígitos.");
      return;
    }

    if (pin !== firstPin) {
      showToast.error(
        "Error",
        "Los PINs no coinciden. Por favor, inténtalo de nuevo."
      );
      setPin("");
      return;
    }

    if (!parsedPrsId) {
      showToast.error("Error", "No se ha proporcionado un ID válido.");
      return;
    }

    setIsLoading(true);

    // Hash in frontend just like Login
    const hashedPin = hashPassword(pin);

    // Call the Save flow
    const result = await authService.registerCollaborator(
      parsedPrsId,
      hashedPin,
    );

    setIsLoading(false);

    if (result.success) {
      // Auto login!
      const loginResult = await login({
        DocumentNumber: doc as string,
        Password: hashedPin,
      });

      if (loginResult.success) {
        await storage.setItem("savedDocumentNumber", doc as string);

        try {
          const pref =
            await secCollaboratorPreferenceService.getMyPreferences();
          if (pref) {
            setPreferences(
              (pref.Theme as any) || "system",
              pref.PrimaryColor || "#002aff",
            );
          }
        } catch (e) {
          console.log("Failed to load user preferences", e);
        }

        showToast.success("¡Éxito!", "Te has registrado correctamente.");
        router.replace("/(protected)/home");
      } else {
        showToast.success(
          "¡Éxito!",
          "Te has registrado correctamente. Por favor inicia sesión."
        );
        router.replace("/");
      }
    } else {
      showToast.error(
        "Error",
        result.error || "No se pudo completar el registro."
      );
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setPin(firstPin);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
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
          <ScrollView contentContainerClassName="flex-grow items-center justify-center p-6">
            <View className="absolute top-12 left-6 z-10">
              <Pressable onPress={handleBack} className="p-2">
                <ChevronLeft size={28} className="text-muted-foreground" />
              </Pressable>
            </View>

            <View className="items-center mb-8 mt-10">
              <Image
                source={require("../../assets/images/logo-nova.svg")}
                style={{ width: 60, height: 60, resizeMode: "contain" }}
                className="mb-4"
              />
              <Text className="text-2xl font-bold font-poppins text-foreground">
                Nova Connect
              </Text>
            </View>

            <Animated.View
              key={step}
              entering={FadeInDown.duration(400).springify()}
              className="bg-card w-full max-w-[300px] mt-2 self-center rounded-3xl p-5 border border-border/40 shadow-sm dark:shadow-xl"
            >
              <View className="items-center mb-3">
                <View
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: primaryColor
                      ? `${primaryColor}20`
                      : "rgba(0,42,255,0.1)",
                  }}
                >
                  <Text
                    className="text-[10px] font-bold font-poppins uppercase tracking-widest"
                    style={{ color: primaryColor || "#002aff" }}
                  >
                    Paso {step} de 2
                  </Text>
                </View>
              </View>
              <Text className="text-xl font-bold font-poppins text-center text-foreground mb-4">
                {step === 1 ? "Crea tu PIN" : "Confirma tu PIN"}
              </Text>

              {/* Keypad */}
              <View className="w-full mb-5 mt-2">
                <PinKeypad
                  pin={pin}
                  onPinChange={setPin}
                  primaryColor={primaryColor || "#002aff"}
                  maxLength={6}
                  shuffle={false}
                />
              </View>

              {step === 1 ? (
                <Pressable 
                  onPress={handleContinue} 
                  disabled={pin.length < 6}
                  className={`w-full h-12 rounded-2xl flex-row items-center justify-center ${pin.length < 6 ? 'bg-muted opacity-60' : ''}`}
                  style={pin.length >= 6 ? { backgroundColor: primaryColor || '#002aff' } : {}}
                >
                  <Text className={`font-poppins text-base font-bold ${pin.length >= 6 ? 'text-white' : 'text-muted-foreground'}`}>
                    Continuar
                  </Text>
                </Pressable>
              ) : (
                <Pressable 
                  onPress={handleRegister} 
                  disabled={isLoading || pin.length < 6}
                  className={`w-full h-12 rounded-2xl flex-row items-center justify-center ${pin.length < 6 ? 'bg-muted opacity-60' : ''}`}
                  style={pin.length >= 6 ? { backgroundColor: primaryColor || '#002aff' } : {}}
                >
                  <Text className={`font-poppins text-base font-bold ${pin.length >= 6 ? 'text-white' : 'text-muted-foreground'}`}>
                    {isLoading ? 'Registrando...' : 'Finalizar Registro'}
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
