import { NImage } from "@/components/custom/NImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { useAuthStore } from "@/stores/useAuthStore";
import { router } from "expo-router";
import {
  Briefcase,
  Building2,
  ChevronRight,
  HelpCircle,
  IdCard,
  LogOut,
  QrCode,
  Settings,
} from "lucide-react-native";
import * as React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  const handleSettings = () => {
    router.push("/(protected)/settings");
  };

  const handleLogout = async () => {
    AlertHelper.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar tu sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="w-full max-w-lg self-center gap-4">
          {/* User Profile Section */}
          <View className="flex-row items-center gap-4 py-2">
            <View className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden items-center justify-center bg-muted">
              <NImage
                genParameter="ROUTE_PERSONS"
                fileName={user?.PrsPhoto}
                className="w-full h-full"
                fallbackText={user?.PrsName?.[0] || "U"}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-xl font-bold uppercase tracking-tight"
                numberOfLines={2}
              >
                {user?.FullName || "COLABORADOR NOVA"}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {user?.PstName || user?.TypeWorkerName || "Colaborador"}
              </Text>
            </View>
          </View>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon as={IdCard} size={16} className="text-muted-foreground" />
                  <Text className="text-sm font-medium">Documento</Text>
                </View>
                <Text className="text-sm text-muted-foreground">
                  {user?.PrsDocumentNumber || "Sin Documento"}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon as={Briefcase} size={16} className="text-muted-foreground" />
                  <Text className="text-sm font-medium">Cargo</Text>
                </View>
                <Text
                  className="text-sm text-muted-foreground uppercase text-right flex-1 ml-4"
                  numberOfLines={1}
                >
                  {user?.PstName || user?.TypeWorkerName || "PROGRAMADOR"}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon as={Building2} size={16} className="text-muted-foreground" />
                  <Text className="text-sm font-medium">Área</Text>
                </View>
                <Text
                  className="text-sm text-muted-foreground uppercase text-right flex-1 ml-4"
                  numberOfLines={1}
                >
                  {user?.AreName || "TECNOLOGÍA DE LA INFORMACIÓN"}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Actions List */}
          <View className="gap-2">
            <Button
              variant="secondary"
              className="justify-between h-14"
              onPress={() => {}}
            >
              <View className="flex-row items-center gap-3">
                <Icon as={QrCode} size={20} strokeWidth={1.5} className="text-foreground" />
                <Text className="font-semibold text-base">Código QR</Text>
              </View>
              <Icon
                as={ChevronRight}
                size={20}
                className="text-muted-foreground"
              />
            </Button>

            <Button
              variant="secondary"
              className="justify-between h-14"
              onPress={() => {}}
            >
              <View className="flex-row items-center gap-3">
                <Icon as={HelpCircle} size={20} className="text-foreground" />
                <Text className="font-semibold text-base">Centro de Ayuda</Text>
              </View>
              <Icon as={ChevronRight} className="text-muted-foreground" />
            </Button>

            <Button
              variant="secondary"
              className="justify-between h-12"
              onPress={handleSettings}
            >
              <View className="flex-row items-center gap-3">
                <Icon as={Settings} size={20} className="text-foreground" />
                <Text className="font-semibold text-base">Configuración</Text>
              </View>
              <Icon as={ChevronRight} className="text-muted-foreground" />
            </Button>

            <Button
              variant="destructive"
              className="justify-start gap-3 mt-4 h-12"
              onPress={handleLogout}
            >
              <Icon as={LogOut} size={20} className="text-foreground" />
              <Text>Cerrar Sesión</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
