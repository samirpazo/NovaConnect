import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { IdCard } from "lucide-react-native";
import { Modal, Pressable, View } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";

interface RegisterModalProps {
  visible: boolean;
  onClose: () => void;
  registerDoc: string;
  onRegisterDocChange: (text: string) => void;
  registerError: string;
  isRegistering: boolean;
  primaryColor: string;
  onValidate: () => void;
}

export function RegisterModal({
  visible,
  onClose,
  registerDoc,
  onRegisterDocChange,
  registerError,
  isRegistering,
  primaryColor,
  onValidate,
}: RegisterModalProps) {
  const handleClose = () => {
    onClose();
    onRegisterDocChange("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center items-center bg-black/50 p-6"
      >
        <View className="bg-card w-full max-w-sm rounded-3xl p-6 items-center shadow-xl">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
            <IdCard size={32} color={primaryColor || "#002aff"} />
          </View>
          <Text className="text-xl font-bold font-poppins text-foreground text-center mb-2">
            Validar Documento
          </Text>
          <Text className="text-muted-foreground text-center mb-6 px-2 text-sm font-poppins">
            Ingresa tu documento para verificar si tienes un contrato activo
            y proceder con el registro.
          </Text>
          <View className="w-full mb-6">
            <Input
              value={registerDoc}
              onChangeText={(text) => {
                onRegisterDocChange(text);
              }}
              placeholder="Número de documento"
              keyboardType="number-pad"
              maxLength={20}
              className={`w-full h-12 bg-muted/50 rounded-2xl text-center text-lg font-bold font-poppins ${registerError ? "border border-destructive" : "border-transparent"}`}
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
              onPress={handleClose}
              className="flex-1 h-12 rounded-2xl"
              disabled={isRegistering}
            >
              <Text className="text-foreground font-poppins text-base font-medium">
                Cancelar
              </Text>
            </Button>
            <Button
              onPress={onValidate}
              className="flex-1 h-12 rounded-2xl"
              style={{ backgroundColor: primaryColor || "#002aff" }}
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
  );
}
