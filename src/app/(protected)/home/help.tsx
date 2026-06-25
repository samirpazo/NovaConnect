import { Text } from "@/components/ui/text";
import { showToast } from "@/lib/toast";
import { genParameterService, HelpData } from "@/services/genParameterService";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { Copy, Headset, Mail, Phone, ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import * as React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HelpScreen() {
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  
  // Garantizar que primaryColor sea un color hexadecimal válido con prefijo '#' y no sea rojo genérico
  const rawColor = storePrimaryColor || "#002aff";
  const cleanColor = rawColor.startsWith("#") ? rawColor : `#${rawColor}`;
  const primaryColor = cleanColor.toLowerCase() === "#ff0000" ? "#002aff" : cleanColor;

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
      `${text} ha sido copiado al portapapeles.`,
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <View className="flex-row items-center px-4 py-2.5 border-b border-border">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
          className="w-8 h-8 items-center justify-center rounded-full bg-secondary"
        >
          <ChevronLeft size={20} color={primaryColor} />
        </Pressable>
        <View className="flex-1 px-3">
          <Text className="text-lg font-poppins-semibold text-foreground">
            Ayuda y Soporte
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="w-full mb-4 mt-2"
        >
          <View className="w-full items-center">
            <LinearGradient
              colors={[
                primaryColor,
                `${primaryColor}aa`,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-14 h-14 rounded-[20px] items-center justify-center mb-4 shadow-sm"
              style={{
                shadowColor: primaryColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 2,
                borderRadius: 20,
              }}
            >
              <Headset size={24} color="#ffffff" strokeWidth={2.2} />
            </LinearGradient>
            <Text className="text-xl font-poppins-bold text-foreground text-center mb-1">
              ¿Necesitas ayuda?
            </Text>
            <Text className="text-xs font-poppins text-muted-foreground text-center px-6 mb-2">
              Si tienes problemas con tu cuenta o necesitas asistencia técnica, por favor comunícate a través de nuestros canales de atención:
            </Text>
          </View>
        </Animated.View>

        {loading ? (
          <View className="items-center justify-center py-6">
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="text-xs font-poppins text-muted-foreground mt-3">
              Cargando información...
            </Text>
          </View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            className="w-full"
          >
            <View className="w-full bg-card rounded-[24px] border border-border p-4 shadow-sm">
              {helpData?.emails && helpData.emails.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row items-center mb-3 px-1">
                    <View className="w-7 h-7 rounded-full items-center justify-center mr-2.5 bg-primary/10">
                      <Mail size={14} color={primaryColor} />
                    </View>
                    <Text className="font-poppins-bold text-sm text-foreground">
                      Correos Electrónicos
                    </Text>
                  </View>
                  <View className="gap-2">
                    {helpData.emails.map((email, idx) => (
                      <Pressable
                        key={`email-${idx}`}
                        onPress={() => handleCopy(email, "email")}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.8 : 1,
                          backgroundColor: pressed ? 'hsl(var(--secondary))' : 'transparent',
                        })}
                        className="flex-row items-center py-2.5 px-3.5 rounded-xl border border-border bg-secondary/30"
                      >
                        <Text className="font-poppins-medium text-xs text-foreground flex-1">
                          {email}
                        </Text>
                        <View className="p-1.5 ml-2 bg-card rounded-lg border border-border">
                          <Copy size={12} color={primaryColor} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {helpData?.emails && helpData.emails.length > 0 && helpData?.phones && helpData.phones.length > 0 && (
                <View className="h-[1px] bg-border my-4" />
              )}

              {helpData?.phones && helpData.phones.length > 0 && (
                <View>
                  <View className="flex-row items-center mb-3 px-1">
                    <View className="w-7 h-7 rounded-full items-center justify-center mr-2.5 bg-primary/10">
                      <Phone size={14} color={primaryColor} />
                    </View>
                    <Text className="font-poppins-bold text-sm text-foreground">
                      Teléfonos
                    </Text>
                  </View>
                  <View className="gap-2">
                    {helpData.phones.map((phone, idx) => (
                      <Pressable
                        key={`phone-${idx}`}
                        onPress={() => handleCopy(phone, "phone")}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.8 : 1,
                          backgroundColor: pressed ? 'hsl(var(--secondary))' : 'transparent',
                        })}
                        className="flex-row items-center py-2.5 px-3.5 rounded-xl border border-border bg-secondary/30"
                      >
                        <Text className="font-poppins-medium text-xs text-foreground flex-1">
                          {phone}
                        </Text>
                        <View className="p-1.5 ml-2 bg-card rounded-lg border border-border">
                          <Copy size={12} color={primaryColor} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {!helpData?.emails?.length && !helpData?.phones?.length && (
                <View className="items-center justify-center py-6">
                  <Text className="text-xs font-poppins text-muted-foreground">
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
