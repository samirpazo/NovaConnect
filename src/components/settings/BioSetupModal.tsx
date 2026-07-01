import { Text } from "@/components/ui/text";
import { PinKeypad } from "@/components/ui/pin-keypad";
import { Fingerprint, ScanFace, X } from "lucide-react-native";
import { Modal, Platform, Pressable, View } from "react-native";
import { KeyboardAvoidingView } from "react-native";

interface BioSetupModalProps {
  visible: boolean;
  onClose: () => void;
  pin: string;
  onPinChange: (v: string) => void;
  isActivating: boolean;
  primaryColor: string;
  onConfirm: () => void;
}

export function BioSetupModal({
  visible,
  onClose,
  pin,
  onPinChange,
  isActivating,
  primaryColor,
  onConfirm,
}: BioSetupModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center items-center p-6"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <View className="bg-card w-full max-w-[320px] rounded-[24px] p-6 relative border border-border">
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
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
              pin={pin}
              onPinChange={onPinChange}
              primaryColor={primaryColor}
              maxLength={6}
            />
          </View>

          <Pressable
            onPress={onConfirm}
            disabled={isActivating || pin.length < 4}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            className={`w-full h-12 rounded-[16px] flex-row items-center justify-center ${pin.length >= 4 ? "bg-primary" : "bg-muted opacity-60"}`}
          >
            <Text
              className={`font-poppins-bold text-base ${pin.length >= 4 ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {isActivating ? "Activando..." : "Confirmar"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
