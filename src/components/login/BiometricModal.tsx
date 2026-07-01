import { Text } from "@/components/ui/text";
import { PinKeypad } from "@/components/ui/pin-keypad";
import { Fingerprint, ScanFace, X } from "lucide-react-native";
import { Modal, Platform, Pressable, View } from "react-native";
import { KeyboardAvoidingView } from "react-native";

interface BiometricModalProps {
  visible: boolean;
  onClose: () => void;
  pin: string;
  onPinChange: (pin: string) => void;
  isAuthenticating: boolean;
  primaryColor: string;
  onSubmit: () => void;
}

export function BiometricModal({
  visible,
  onClose,
  pin,
  onPinChange,
  isAuthenticating,
  primaryColor,
  onSubmit,
}: BiometricModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center items-center bg-black/50 p-6"
      >
        <View className="bg-card w-full max-w-[320px] rounded-3xl p-6 shadow-xl relative">
          <Pressable
            onPress={onClose}
            className="absolute top-4 right-4 p-2 z-10"
          >
            <X size={20} className="text-muted-foreground" />
          </Pressable>

          <View className="items-center mb-4 mt-2">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
              {Platform.OS === "ios" ? (
                <ScanFace size={24} className="text-primary" />
              ) : (
                <Fingerprint size={24} className="text-primary" />
              )}
            </View>
            <Text className="text-xl font-bold text-foreground font-poppins text-center">
              Activar Biometría
            </Text>
            <Text className="text-sm text-muted-foreground font-poppins text-center mt-2">
              Ingresa tu PIN para vincular tu huella o rostro y usarlo la
              próxima vez.
            </Text>
          </View>

          <View className="mb-6 mt-4">
            <PinKeypad
              pin={pin}
              onPinChange={onPinChange}
              primaryColor={primaryColor || "#002aff"}
              maxLength={6}
            />
          </View>

          <Pressable
            onPress={onSubmit}
            disabled={isAuthenticating || pin.length < 4}
            className={`w-full h-12 rounded-2xl flex-row items-center justify-center ${pin.length >= 4 ? "bg-primary" : "bg-muted opacity-60"}`}
          >
            <Text
              className={`font-bold font-poppins text-base ${pin.length >= 4 ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {isAuthenticating ? "Activando..." : "Confirmar"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
