import { VaultFile, useVault } from "@/hooks/useVault";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { DateTime } from "luxon";
import { router } from "expo-router";
import { ChevronLeft, FileText, HardDrive, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VaultScreen() {
  const { primaryColor } = usePreferenceStore();
  const { getVaultFiles, deleteFromVault, openVaultFile } = useVault();
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== "web") {
      loadFiles();
    } else {
      setLoading(false);
    }
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const fetchedFiles = await getVaultFiles();
      setFiles(fetchedFiles);
    } catch (error) {
      console.error("Error loading vault:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (file: VaultFile) => {
    Alert.alert(
      "Eliminar documento",
      `¿Estás seguro de que deseas eliminar ${file.name} de tu bóveda?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteFromVault(file.name);
            loadFiles();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: VaultFile }) => (
    <View className="flex-row items-center justify-between p-4 mb-3 bg-card border border-border/50 rounded-2xl shadow-sm">
      <TouchableOpacity
        onPress={() => openVaultFile(item.uri)}
        className="flex-row items-center flex-1"
      >
        <View
          className="w-12 h-12 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: `${primaryColor || "#002aff"}15` }}
        >
          <FileText size={24} color={primaryColor || "#002aff"} />
        </View>
        <View className="flex-1">
          <Text
            className="font-poppins-semibold text-foreground text-base"
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text className="font-poppins text-muted-foreground text-xs mt-0.5">
            {DateTime.fromMillis(item.modificationTime * 1000)
              .setLocale("es")
              .toFormat("dd MMM yyyy, HH:mm")}{" "}
            • {(item.size / 1024 / 1024).toFixed(2)} MB
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleDelete(item)}
        className="w-10 h-10 items-center justify-center rounded-full ml-2 bg-destructive/10"
      >
        <Trash2 size={20} className="text-destructive" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/40">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-secondary/50"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-poppins-semibold text-foreground">
          Bóveda Offline
        </Text>
        <View className="w-10 h-10" />
      </View>

      {/* Content */}
      <View className="flex-1 px-4 pt-4">
        <View className="bg-secondary/30 p-4 rounded-xl flex-row items-center mb-6">
          <HardDrive size={24} color={primaryColor || "#002aff"} />
          <Text className="ml-3 font-poppins text-sm text-foreground flex-1">
            Los documentos guardados aquí están encriptados y disponibles sin conexión a internet.
          </Text>
        </View>

        {Platform.OS === "web" ? (
          <View className="flex-1 items-center justify-center pb-20">
            <View className="w-24 h-24 rounded-full bg-secondary/50 items-center justify-center mb-4">
              <HardDrive size={40} className="text-muted-foreground" />
            </View>
            <Text className="text-lg font-poppins-semibold text-foreground text-center">
              No disponible en la Web
            </Text>
            <Text className="text-sm font-poppins text-muted-foreground text-center mt-2 px-6">
              La Bóveda Offline requiere acceso al almacenamiento seguro de tu dispositivo móvil.
            </Text>
          </View>
        ) : loading ? (
          <Text className="text-center font-poppins text-muted-foreground mt-10">
            Cargando bóveda...
          </Text>
        ) : files.length === 0 ? (
          <View className="flex-1 items-center justify-center pb-20">
            <View className="w-24 h-24 rounded-full bg-secondary/50 items-center justify-center mb-4">
              <HardDrive size={40} className="text-muted-foreground" />
            </View>
            <Text className="text-lg font-poppins-semibold text-foreground text-center">
              Tu bóveda está vacía
            </Text>
            <Text className="text-sm font-poppins text-muted-foreground text-center mt-2 px-6">
              Abre cualquier documento y presiona el ícono de guardar para tenerlo disponible sin internet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={files}
            keyExtractor={(item) => item.name}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
