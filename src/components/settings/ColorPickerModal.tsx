import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { X } from "lucide-react-native";
import { Modal, Pressable, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";

interface ColorPickerModalProps {
  visible: boolean;
  onClose: () => void;
  primaryColor: string;
  onColorComplete: (color: { hex: string }) => void;
}

export function ColorPickerModal({
  visible,
  onClose,
  primaryColor,
  onColorComplete,
}: ColorPickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View className="w-full max-w-sm bg-card rounded-[24px] p-6 border border-border">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-poppins-bold text-foreground">
                Elige un color
              </Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                className="p-2 bg-secondary rounded-full"
              >
                <X size={20} className="text-foreground" />
              </Pressable>
            </View>

            <ColorPicker
              style={{ width: "100%", gap: 20 }}
              value={primaryColor}
              onComplete={onColorComplete}
            >
              <Panel1 style={{ height: 200, borderRadius: 16 }} />
              <HueSlider style={{ borderRadius: 12, height: 28 }} />
            </ColorPicker>

            <Button
              className="w-full mt-8"
              variant="default"
              onPress={onClose}
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-poppins-semibold text-base">
                Aceptar
              </Text>
            </Button>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
