import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { hashPassword } from "@/lib/security";
import { showToast } from "@/lib/toast";
import { authService } from "@/services/authService";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  KeyRound,
  MailCheck,
  ShieldCheck,
} from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecoverPinScreen() {
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor || "#002aff";

  const { document } = useLocalSearchParams<{ document?: string }>();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [documentNumber, setDocumentNumber] = React.useState(document || "");
  const [otp, setOtp] = React.useState("");
  const [newPin, setNewPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRequestOtp = async (docToUse?: string) => {
    const doc = docToUse || documentNumber;
    if (!doc || doc.length < 8) return;

    setIsLoading(true);
    const result = await authService.requestPinReset(doc);
    setIsLoading(false);

    if (result.success) {
      setStep(2);
      showToast.success("Código enviado", "Revisa tu bandeja de entrada.");
    } else if (result.noEmail) {
      AlertHelper.alert(
        "Sin correo registrado",
        "No tienes un correo registrado. Por favor, acércate a Recursos Humanos para actualizar tus datos.",
      );
    } else {
      showToast.error("Error", result.error || "Ocurrió un error inesperado.");
    }
  };

  React.useEffect(() => {
    if (document && step === 1) {
      handleRequestOtp(document);
    }
  }, [document]);

  const handleConfirmReset = async () => {
    if (newPin !== confirmPin) {
      showToast.error("Error", "El nuevo PIN y su confirmación no coinciden.");
      return;
    }
    if (newPin.length < 6) {
      showToast.error("Error", "El nuevo PIN debe tener al menos 6 dígitos.");
      return;
    }

    setIsLoading(true);
    const newPasswordHash = await hashPassword(newPin);
    const result = await authService.confirmPinReset(
      documentNumber,
      otp,
      newPasswordHash,
    );
    setIsLoading(false);

    if (result.success) {
      showToast.success("Éxito", "Tu PIN ha sido recuperado correctamente.");
      router.replace("/");
    } else {
      showToast.error("Error", result.error || "No se pudo actualizar el PIN.");
    }
  };

  const renderStep1 = () => (
    <Animated.View
      entering={FadeInRight.duration(400)}
      exiting={FadeOutLeft.duration(300)}
    >
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-4">
          <KeyRound size={32} color={primaryColor} />
        </View>
        <Text className="text-2xl font-poppins-bold text-foreground text-center">
          Recuperar PIN
        </Text>
        <Text className="text-base text-muted-foreground text-center mt-2 px-4 font-poppins">
          Ingresa tu documento para enviarte un código de recuperación a tu
          correo registrado.
        </Text>
      </View>

      <View className="gap-6 mt-4">
        <View>
          <Text className="text-sm font-poppins-medium text-foreground mb-2 ml-1">
            Número de Documento
          </Text>
          <Input
            keyboardType="numeric"
            maxLength={15}
            value={documentNumber}
            onChangeText={setDocumentNumber}
            placeholder="Ej. 70000000"
            editable={!isLoading}
            className="h-14 text-base bg-secondary border-border"
          />
        </View>

        <Button
          onPress={() => handleRequestOtp()}
          disabled={isLoading || documentNumber.length < 8}
          className="h-14 mt-2"
          style={{
            backgroundColor:
              documentNumber.length >= 8 ? primaryColor : undefined,
          }}
        >
          <Text className="text-white font-poppins-bold text-base">
            {isLoading ? "Enviando..." : "Enviar código"}
          </Text>
        </Button>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View
      entering={FadeInRight.duration(400)}
      exiting={FadeOutLeft.duration(300)}
    >
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-4">
          <MailCheck size={32} color={primaryColor} />
        </View>
        <Text className="text-2xl font-poppins-bold text-foreground text-center">
          Verifica tu correo
        </Text>
        <Text className="text-base text-muted-foreground text-center mt-2 px-4 font-poppins">
          Hemos enviado un código de 6 dígitos a tu correo electrónico.
        </Text>
      </View>

      <View className="gap-6 mt-4">
        <View>
          <Text className="text-sm font-poppins-medium text-foreground mb-4 ml-1 text-center">
            Código de 6 dígitos
          </Text>
          <OtpInput value={otp} onChangeText={setOtp} />
        </View>

        <Button
          onPress={() => setStep(3)}
          disabled={otp.length < 6}
          className="h-14 mt-2"
          style={{
            backgroundColor: otp.length === 6 ? primaryColor : undefined,
          }}
        >
          <Text className="text-white font-poppins-bold text-base">
            Verificar código
          </Text>
        </Button>
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View
      entering={FadeInRight.duration(400)}
      exiting={FadeOutLeft.duration(300)}
    >
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-4">
          <ShieldCheck size={32} color={primaryColor} />
        </View>
        <Text className="text-2xl font-poppins-bold text-foreground text-center">
          Crear nuevo PIN
        </Text>
        <Text className="text-base text-muted-foreground text-center mt-2 px-4 font-poppins">
          Ingresa un nuevo PIN de 6 dígitos para acceder a tu cuenta.
        </Text>
      </View>

      <View className="gap-6 mt-6">
        <View>
          <Text className="text-[12px] font-poppins-medium text-foreground mb-2 ml-1">
            Nuevo PIN
          </Text>
          <OtpInput value={newPin} onChangeText={setNewPin} secureTextEntry />
        </View>
        <View>
          <Text className="text-[12px] font-poppins-medium text-foreground mb-2 ml-1">
            Confirmar PIN
          </Text>
          <OtpInput
            value={confirmPin}
            onChangeText={setConfirmPin}
            secureTextEntry
          />
        </View>

        <Button
          onPress={handleConfirmReset}
          disabled={isLoading || newPin.length < 6 || confirmPin.length < 6}
          className="h-14 mt-4"
          style={{
            backgroundColor: newPin.length >= 6 ? primaryColor : undefined,
          }}
        >
          <Text className="text-white font-poppins-bold text-base">
            {isLoading ? "Guardando..." : "Restablecer PIN"}
          </Text>
        </Button>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="w-full flex-row justify-between items-center p-4 min-h-[60px] z-10">
        <Pressable
          onPress={() =>
            step > 1 ? setStep((prev) => (prev - 1) as any) : router.back()
          }
          className="p-2 w-12 h-12 justify-center items-center rounded-full bg-secondary/50 active:bg-secondary"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </Pressable>
      </View>
      <ScrollView contentContainerClassName="flex-grow p-6">
        <View className="w-full max-w-sm self-center">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
