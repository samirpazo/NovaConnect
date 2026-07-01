import { Text } from "@/components/ui/text";
import { LogOut } from "lucide-react-native";
import { Modal, Pressable, View } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";

interface ConfirmLogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmLogoutModal({ visible, onClose, onConfirm }: ConfirmLogoutModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
              onPress={onClose}
              className="flex-1 h-12 rounded-2xl flex-row items-center justify-center bg-secondary"
            >
              <Text className="font-bold font-poppins text-base text-foreground">
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="flex-1 h-12 rounded-2xl flex-row items-center justify-center bg-destructive"
            >
              <Text className="font-bold font-poppins text-base text-foreground">
                Sí, Eliminar
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
