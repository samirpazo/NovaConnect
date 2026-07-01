import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { Text } from "@/components/ui/text";
import { Modal, View } from "react-native";

interface ChangePinModalProps {
  visible: boolean;
  onClose: () => void;
  oldPin: string;
  onOldPinChange: (v: string) => void;
  newPin: string;
  onNewPinChange: (v: string) => void;
  confirmPin: string;
  onConfirmPinChange: (v: string) => void;
  isChanging: boolean;
  primaryColor: string;
  onChange: () => void;
}

export function ChangePinModal({
  visible,
  onClose,
  oldPin,
  onOldPinChange,
  newPin,
  onNewPinChange,
  confirmPin,
  onConfirmPinChange,
  isChanging,
  primaryColor,
  onChange,
}: ChangePinModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !isChanging && onClose()}
    >
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <View className="w-full max-w-sm bg-card rounded-[24px] p-6 border border-border">
          <Text className="text-xl font-poppins-bold text-foreground mb-1">
            Cambiar PIN
          </Text>
          <Text className="text-sm font-poppins text-muted-foreground mb-6">
            Ingresa tu PIN actual y el nuevo código de 6 dígitos.
          </Text>

          <View className="gap-4 mb-8">
            <View>
              <Text className="text-[12px] font-poppins-medium text-foreground mb-2 ml-1">
                PIN Actual
              </Text>
              <OtpInput value={oldPin} onChangeText={onOldPinChange} secureTextEntry />
            </View>
            <View>
              <Text className="text-[12px] font-poppins-medium text-foreground mb-2 ml-1">
                Nuevo PIN
              </Text>
              <OtpInput value={newPin} onChangeText={onNewPinChange} secureTextEntry />
            </View>
            <View>
              <Text className="text-[12px] font-poppins-medium text-foreground mb-2 ml-1">
                Confirmar Nuevo PIN
              </Text>
              <OtpInput value={confirmPin} onChangeText={onConfirmPinChange} secureTextEntry />
            </View>
          </View>

          <View className="flex-row justify-end gap-3">
            <Button
              variant="ghost"
              onPress={onClose}
              disabled={isChanging}
              className="px-6 h-12"
            >
              <Text>Cancelar</Text>
            </Button>
            <Button
              onPress={onChange}
              disabled={isChanging || oldPin.length < 6 || newPin.length < 6 || confirmPin.length < 6}
              className="px-6 h-12"
              style={{ backgroundColor: newPin.length >= 6 ? primaryColor : undefined }}
            >
              <Text className="font-poppins-bold text-white">
                {isChanging ? "Guardando..." : "Cambiar"}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
