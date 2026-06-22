import { Text } from "@/components/ui/text";
import { genParameterService, HelpData } from "@/services/genParameterService";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { showToast } from "@/lib/toast";
import * as Clipboard from "expo-clipboard";
import { Copy, Headset, Mail, Phone } from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export default function HelpScreen() {
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor;

  const [helpData, setHelpData] = React.useState<HelpData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchHelpData = async () => {
      try {
        const data = await genParameterService.getHelpInfo();
        setHelpData(data);
      } catch (error) {
        console.error("Error fetching help data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHelpData();
  }, []);

  const handleCopy = async (text: string, type: "email" | "phone") => {
    await Clipboard.setStringAsync(text);
    showToast.success(
      type === "email" ? "Correo copiado" : "Teléfono copiado",
      `${text} ha sido copiado al portapapeles.`
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="w-full mb-8 mt-4"
        >
          <View className="w-full items-center">
            <LinearGradient
              colors={[primaryColor || "#002aff", `${primaryColor || "#002aff"}60`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-20 h-20 rounded-[24px] items-center justify-center mb-6 shadow-lg"
              style={{
                shadowColor: primaryColor || "#002aff",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              <Headset size={36} color="#ffffff" strokeWidth={2.5} />
            </LinearGradient>
            <Text className="text-2xl font-poppins-bold text-foreground text-center mb-2">
              ¿Necesitas ayuda?
            </Text>
            <Text className="text-sm font-poppins text-muted-foreground text-center px-4 mb-4">
              Si tienes problemas con tu cuenta o necesitas asistencia técnica,
              por favor comunícate a través de nuestros canales de atención:
            </Text>
          </View>
        </Animated.View>

        {loading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color={primaryColor || "#002aff"} />
            <Text className="text-sm font-poppins text-muted-foreground mt-4">
              Cargando información...
            </Text>
          </View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            className="w-full"
          >
            <View className="w-full gap-6">
              {helpData?.emails && helpData.emails.length > 0 && (
                <View className="bg-card rounded-[20px] border border-border/40 p-4 shadow-sm">
                  <View className="flex-row items-center mb-3">
                    <Mail size={18} className="text-foreground mr-2.5" />
                    <Text className="font-poppins-semibold text-sm text-foreground">
                      Correos Electrónicos
                    </Text>
                  </View>
                  <View className="gap-2">
                    {helpData.emails.map((email, idx) => (
                      <View
                        key={`email-${idx}`}
                        className="flex-row items-center bg-secondary/50 py-2.5 px-3 rounded-lg border border-border/20"
                      >
                        <Text className="font-poppins-medium text-sm text-foreground flex-1">
                          {email}
                        </Text>
                        <Pressable
                          onPress={() => handleCopy(email, "email")}
                          className="p-2 ml-2 bg-card rounded-md border border-border/40 active:opacity-70"
                        >
                          <Copy size={16} className="text-muted-foreground" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {helpData?.phones && helpData.phones.length > 0 && (
                <View className="bg-card rounded-[20px] border border-border/40 p-4 shadow-sm">
                  <View className="flex-row items-center mb-3">
                    <Phone size={18} className="text-foreground mr-2.5" />
                    <Text className="font-poppins-semibold text-sm text-foreground">
                      Teléfonos
                    </Text>
                  </View>
                  <View className="gap-2">
                    {helpData.phones.map((phone, idx) => (
                      <View
                        key={`phone-${idx}`}
                        className="flex-row items-center bg-secondary/50 py-2.5 px-3 rounded-lg border border-border/20"
                      >
                        <Text className="font-poppins-medium text-sm text-foreground flex-1">
                          {phone}
                        </Text>
                        <Pressable
                          onPress={() => handleCopy(phone, "phone")}
                          className="p-2 ml-2 bg-card rounded-md border border-border/40 active:opacity-70"
                        >
                          <Copy size={16} className="text-muted-foreground" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {!helpData?.emails?.length && !helpData?.phones?.length && (
                <View className="items-center justify-center py-8">
                  <Text className="text-sm font-poppins text-muted-foreground">
                    No hay información de contacto disponible.
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
