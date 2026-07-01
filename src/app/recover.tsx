import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { sanitizePrimaryColor } from "@/lib/colorUtils";
import { hashPassword } from "@/lib/security";
import { showToast } from "@/lib/toast";
import { storage } from "@/lib/storage";
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
  const primaryColor = sanitizePrimaryColor(storePrimaryColor);

  const { document } = useLocalSearchParams<{ document?: string }>();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [documentNumber, setDocumentNumber] = React.useState(document || "");
  const [otp, setOtp] = React.useState("");
  const [newPin, setNewPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Reenviar contador
  const [resendCount, setResendCount] = React.useState(0);
  const [countdown, setCountdown] = React.useState(0);
  const RESEND_INTERVALS = process.env.EXPO_PUBLIC_OTP_RESEND_INTERVALS
    ? process.env.EXPO_PUBLIC_OTP_RESEND_INTERVALS.split(",").map(Number)
    : [1, 2, 5, 15, 30, 60, 120, 1440];

  React.useEffect(() => {
    const initTimer = async () => {
      const savedCount = await storage.getItem("otp_resend_count");
      const savedTime = await storage.getItem("otp_resend_time");
      
      if (savedCount && savedTime) {
        const timeMs = parseInt(savedTime, 10);
        const count = parseInt(savedCount, 10);
        
        const now = Date.now();
        const maxInterval = RESEND_INTERVALS[RESEND_INTERVALS.length - 1] || 1440;
        
        if (now > timeMs + (maxInterval * 60 * 1000)) {
          await storage.removeItem("otp_resend_count");
          await storage.removeItem("otp_resend_time");
          setResendCount(0);
        } else if (now < timeMs) {
          setResendCount(count);
          setCountdown(Math.ceil((timeMs - now) / 1000));
        } else {
          setResendCount(count);
        }
      }
    };
    initTimer();
  }, []);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleRequestOtp = async (docToUse?: string, forceResend: boolean = false) => {
    const doc = docToUse || documentNumber;
    if (!doc || doc.length < 8) return;

    if (forceResend) {
      const nextCount = Math.min(resendCount + 1, RESEND_INTERVALS.length);
      const intervalMinutes = RESEND_INTERVALS[nextCount - 1];
      const nextTime = Date.now() + (intervalMinutes * 60 * 1000);
      
      await storage.setItem("otp_resend_count", nextCount.toString());
      await storage.setItem("otp_resend_time", nextTime.toString());
      
      setResendCount(nextCount);
      setCountdown(intervalMinutes * 60);
    }

    setIsLoading(true);
    const result = await authService.requestPinReset(doc, forceResend);
    setIsLoading(false);

    if (result.success) {
      setStep(2);
      showToast.success("Código enviado", forceResend ? "Se ha reenviado el código a tu correo." : "Revisa tu bandeja de entrada.");
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
      // Actualizar la biometría si el usuario la tiene activa para el mismo documento
      const isBioEnabled = await storage.getItem("isBiometricEnabled");
      const savedDoc = await storage.getItem("savedDocumentNumber");
      
      if (isBioEnabled === "true" && savedDoc === documentNumber) {
        await storage.setItem("savedHashedPin", newPasswordHash);
      }

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

        <View className="mt-4 flex-row justify-center items-center">
          <Text className="text-sm font-poppins text-muted-foreground">
            ¿No recibiste el código?{" "}
          </Text>
          <Pressable 
            onPress={() => handleRequestOtp(undefined, true)}
            disabled={countdown > 0 || isLoading}
          >
            <Text 
              className="text-sm font-poppins-bold" 
              style={{ color: countdown > 0 ? "gray" : primaryColor, opacity: countdown > 0 ? 0.6 : 1 }}
            >
              {countdown > 0 
                ? `Reenviar en ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` 
                : "Reenviar"}
            </Text>
          </Pressable>
        </View>
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
            step > 1 ? setStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3) : router.back()
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
