import { Text } from "@/components/ui/text";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { showToast } from "@/lib/toast";
import { saveDocumentToDevice } from "@/services/documentDownload";
import { FileText, Loader2, Share2, X } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native";

export type DocumentViewerModalProps = {
  visible: boolean;
  fileId: number | null;
  fileName?: string;
  title?: string;
  subtitle?: string;
  periodMonth?: string;
  periodYear?: string;
  onClose: () => void;
};

/**
 * Visor de documentos en nativo.
 *
 * La aplicacion no lleva un visor PDF embebido (no se quiere la dependencia
 * nativa de PDF): el archivo se descarga autenticado y se entrega al visor del
 * sistema. En iOS el share sheet es la via para dejar el PDF en "Archivos"; en
 * Android ofrece las mismas dos salidas, asi que el texto cambia por
 * plataforma.
 */
export default function DocumentViewerModal({
  visible,
  fileId,
  fileName,
  title,
  subtitle,
  onClose,
}: DocumentViewerModalProps) {
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor = storePrimaryColor || "#002aff";

  const [sharing, setSharing] = React.useState(false);

  const label = title || fileName || "Documento";

  const handleShare = async () => {
    if (!fileId) return;
    setSharing(true);
    try {
      await saveDocumentToDevice(fileId, fileName || label);
    } catch {
      showToast.error("Error", "No se pudo abrir el documento.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-[28px] border-t border-border/40 bg-card px-6 pb-10 pt-6">
          <View className="mb-5 flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <FileText size={22} color={primaryColor} />
            </View>
            <View className="flex-1">
              <Text
                className="text-base font-poppins-bold text-foreground"
                numberOfLines={2}
              >
                {label}
              </Text>
              {subtitle ? (
                <Text className="text-xs font-poppins-medium capitalize text-muted-foreground">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar el visor"
              className="h-10 w-10 items-center justify-center rounded-full bg-secondary/50 active:opacity-70"
            >
              <X size={20} className="text-muted-foreground" />
            </Pressable>
          </View>

          <Text className="mb-5 text-sm font-poppins-medium leading-5 text-muted-foreground">
            {Platform.OS === "ios"
              ? "El documento se abre con el visor de PDF del sistema. Desde ahi puedes guardarlo en Archivos o compartirlo."
              : "El documento se abre con el visor de PDF del sistema, donde puedes guardarlo o compartirlo."}
          </Text>

          <Pressable
            onPress={() => void handleShare()}
            disabled={sharing || !fileId}
            accessibilityRole="button"
            accessibilityLabel="Abrir el documento con otra aplicacion"
            className="flex-row items-center justify-center gap-2 rounded-[16px] py-4 active:opacity-80 disabled:opacity-60"
            style={{ backgroundColor: primaryColor }}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Share2 size={18} color="#ffffff" />
            )}
            <Text className="text-sm font-poppins-bold text-white">
              {sharing
                ? "Preparando..."
                : Platform.OS === "ios"
                  ? "Guardar en Archivos"
                  : "Abrir o guardar el documento"}
            </Text>
          </Pressable>

          {sharing ? (
            <View className="mt-3 flex-row items-center justify-center gap-2">
              <Loader2 size={14} className="text-muted-foreground" />
              <Text className="text-xs font-poppins-medium text-muted-foreground">
                Descargando documento...
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
