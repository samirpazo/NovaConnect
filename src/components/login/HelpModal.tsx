import { Text } from "@/components/ui/text";
import { HelpData } from "@/services/genParameterService";
import { Headset, Mail, Phone, X } from "lucide-react-native";
import { Modal, Pressable, View } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  primaryColor: string;
  helpData: HelpData | null;
}

export function HelpModal({ visible, onClose, primaryColor, helpData }: HelpModalProps) {
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
          <Pressable
            onPress={onClose}
            className="absolute top-4 right-4 p-2 z-10"
          >
            <X size={20} className="text-muted-foreground" />
          </Pressable>

          <View className="items-center mb-4 mt-2">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
              <Headset size={24} color={primaryColor || "#002aff"} />
            </View>
            <Text className="text-xl font-bold text-foreground font-poppins">
              Centro de Ayuda
            </Text>
            <Text className="text-sm text-muted-foreground font-poppins text-center mt-3 mb-2">
              Si tienes problemas para acceder a tu cuenta, por favor
              comunícate con tu administrador o contáctanos:
            </Text>

            {helpData ? (
              <View className="w-full mt-2">
                {helpData.emails?.map((email, idx) => (
                  <View
                    key={`email-${idx}`}
                    className="flex-row items-center justify-center mb-2"
                  >
                    <Mail size={14} color={primaryColor || "#002aff"} />
                    <Text className="text-sm font-bold font-poppins text-center text-foreground ml-2">
                      {email}
                    </Text>
                  </View>
                ))}
                {helpData.phones?.map((phone, idx) => (
                  <View
                    key={`phone-${idx}`}
                    className="flex-row items-center justify-center mb-1"
                  >
                    <Phone size={14} color={primaryColor || "#002aff"} />
                    <Text className="text-sm font-bold font-poppins text-center text-foreground ml-2">
                      {phone}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm font-bold text-primary font-poppins text-center mt-2">
                Cargando información...
              </Text>
            )}
          </View>

          <Pressable
            onPress={onClose}
            className="w-full h-12 rounded-2xl flex-row items-center justify-center bg-secondary mt-2"
          >
            <Text className="font-bold font-poppins text-base text-foreground">
              Entendido
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
