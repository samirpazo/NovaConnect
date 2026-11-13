import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { genParameterService, HelpData } from "@/services/genParameterService";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { showToast } from "@/lib/toast";
import * as Clipboard from "expo-clipboard";
import {
  ChevronRight,
  Copy,
  Headset,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  View,
} from "react-native";

function digitsOf(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

export default function HelpCenterScreen() {
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor || "#002aff";

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
    void fetchHelpData();
  }, []);

  const handleCopy = async (text: string, type: "email" | "phone") => {
    await Clipboard.setStringAsync(text);
    showToast.success(
      type === "email" ? "Correo copiado" : "Teléfono copiado",
      `${text} ha sido copiado al portapapeles.`
    );
  };

  const handleWhatsApp = async (phone: string) => {
    const digits = digitsOf(phone);
    if (!digits) {
      showToast.error("Error", "El número de contacto no es válido.");
      return;
    }
    try {
      await Linking.openURL(`https://wa.me/${digits}`);
    } catch {
      showToast.error(
        "Error",
        "No se pudo abrir WhatsApp en este dispositivo."
      );
    }
  };

  const handleCall = async (phone: string) => {
    const digits = digitsOf(phone);
    if (!digits) {
      showToast.error("Error", "El número de contacto no es válido.");
      return;
    }
    try {
      await Linking.openURL(`tel:${digits}`);
    } catch {
      showToast.error(
        "Error",
        "No se pudo iniciar la llamada en este dispositivo."
      );
    }
  };

  const phone = helpData?.phones?.[0];
  const hasContact =
    !!helpData?.emails?.length || !!helpData?.phones?.length;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8 w-full">
          <View className="flex-row items-center gap-4 rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
              <Headset size={24} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-poppins-bold text-foreground">
                ¿En qué podemos ayudarte?
              </Text>
              <Text className="mt-1.5 text-xs leading-5 font-poppins-medium text-muted-foreground">
                Comunícate directamente con nuestro equipo de atención
              </Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="mt-4 text-sm font-poppins-medium text-muted-foreground">
              Cargando información...
            </Text>
          </View>
        ) : (
          <View className="w-full">
            {hasContact ? (
              <>
                <Text className="mb-4 px-1 text-xs font-poppins-bold uppercase tracking-widest text-muted-foreground">
                  Canales directos
                </Text>
                <View className="gap-4">
                  {phone ? (
                    <View className="w-full flex-row items-center gap-4 rounded-2xl border border-emerald-500/40 bg-card p-4 shadow-sm">
                      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500">
                        <MessageCircle size={24} color="#ffffff" />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="text-base font-poppins-bold text-foreground">
                            WhatsApp Recursos Humanos
                          </Text>
                          <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                            <Text className="text-[10px] font-poppins-bold uppercase tracking-wider text-emerald-600">
                              Rápido
                            </Text>
                          </View>
                        </View>
                        <Text className="mt-1.5 text-xs leading-5 font-poppins-medium text-muted-foreground">
                          Escríbenos para consultas sobre boletas, contratos o
                          dudas laborales
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => void handleWhatsApp(phone)}
                        accessibilityRole="button"
                        accessibilityLabel="Escribir por WhatsApp"
                        className="h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 active:opacity-70"
                      >
                        <ChevronRight size={18} color="#10B981" />
                      </Pressable>
                    </View>
                  ) : null}

                  {phone ? (
                    <View className="w-full flex-row items-center gap-4 rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
                      <View
                        className="h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${primaryColor}1f` }}
                      >
                        <Phone size={24} color={primaryColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-poppins-bold text-foreground">
                          Llamada Telefónica
                        </Text>
                        <Text className="mt-1.5 text-xs leading-5 font-poppins-medium text-muted-foreground">
                          Atención directa para incidencias o problemas con la
                          aplicación
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => void handleCall(phone)}
                        accessibilityRole="button"
                        accessibilityLabel="Llamar al teléfono de soporte"
                        className="h-9 w-9 items-center justify-center rounded-full bg-secondary/60 active:opacity-70"
                      >
                        <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
                      </Pressable>
                    </View>
                  ) : null}

                  {helpData?.emails && helpData.emails.length > 0 ? (
                    <View className="w-full gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
                      <View className="flex-row items-center gap-2.5">
                        <Mail size={18} color={primaryColor} />
                        <Text className="text-sm font-poppins-bold text-foreground">
                          Correos Electrónicos
                        </Text>
                      </View>
                      {helpData.emails.map((email, index) => (
                        <View
                          key={`email-${index}`}
                          className="flex-row items-center gap-3 rounded-xl border border-border/20 bg-secondary/50 px-3 py-2.5"
                        >
                          <Text className="flex-1 text-sm font-poppins-medium text-foreground">
                            {email}
                          </Text>
                          <Pressable
                            onPress={() => void handleCopy(email, "email")}
                            accessibilityRole="button"
                            accessibilityLabel={`Copiar el correo ${email}`}
                            className="rounded-md border border-border/40 bg-card p-2 active:opacity-70"
                          >
                            <Icon as={Copy} size={16} className="text-muted-foreground" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </>
            ) : (
              <View className="items-center justify-center py-8">
                <Text className="text-sm font-poppins-medium text-muted-foreground">
                  No hay información de contacto disponible.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
