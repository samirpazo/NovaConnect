import { offlineDocumentsService } from "@/services/offlineDocuments";
import { isDocumentCached } from "@/services/documentDownload";
import { Text } from "@/components/ui/text";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { showToast } from "@/lib/toast";
import {
  downloadDocument,
  getCachedDocumentUri,
  saveDocumentToDevice,
} from "@/services/documentDownload";
import { Download, FileText, Loader2, RotateCw, X } from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";

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
 * Visor de documentos en web.
 *
 * El PDF se muestra dentro de la aplicacion con un iframe alimentado por el
 * blob descargado con la sesion: la URL de GenFiles exige Authorization, asi
 * que abrirla directamente en una pestana devolveria 401.
 */
export default function DocumentViewerModal({
  visible,
  fileId,
  fileName,
  title,
  subtitle,
  periodMonth,
  periodYear,
  onClose,
}: DocumentViewerModalProps) {
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor = storePrimaryColor || "#002aff";

  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState(false);
  const objectUrlRef = React.useRef<string | null>(null);

  const releaseUrl = React.useCallback(() => {
    if (objectUrlRef.current) {
      window.URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const load = React.useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    setUrl(null);
    releaseUrl();
    try {
      // Primero la copia guardada para ver sin conexion; si no existe, se
      // descarga con la sesion.
      const objectUrl =
        (await getCachedDocumentUri(fileId)) ??
        (await downloadDocument(fileId));
      if (await isDocumentCached(fileId)) {
        await offlineDocumentsService
          .upsert({ fileId, title: title || fileName, periodMonth, periodYear })
          .catch(() => {});
      }
      objectUrlRef.current = objectUrl;
      setUrl(objectUrl);
    } catch {
      setError(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "Este documento no esta guardado para verse sin conexion."
          : "No se pudo cargar el documento.",
      );
    } finally {
      setLoading(false);
    }
  }, [fileId, releaseUrl, title, fileName, periodMonth, periodYear]);

  React.useEffect(() => {
    if (!visible || !fileId) return;
    // La carga se agenda en la siguiente vuelta para no actualizar el estado
    // de forma síncrona dentro del efecto.
    const timer = setTimeout(() => {
      setLoading(true);
      void load();
    }, 0);
    return () => {
      clearTimeout(timer);
      releaseUrl();
    };
  }, [visible, fileId, load, releaseUrl]);

  const handleDownload = async () => {
    if (!fileId) return;
    setDownloading(true);
    try {
      await saveDocumentToDevice(fileId, fileName || title || "documento");
      showToast.success(
        "Descarga iniciada",
        "El documento se está guardando en tu equipo.",
      );
    } catch {
      showToast.error("Error", "No se pudo descargar el documento.");
    } finally {
      setDownloading(false);
    }
  };

  const label = title || fileName || "Documento";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 border-b border-border/40 px-4 py-3">
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar el visor"
            className="h-10 w-10 items-center justify-center rounded-full bg-secondary/50 active:opacity-70"
          >
            <X size={20} className="text-muted-foreground" />
          </Pressable>

          <View className="flex-1">
            <Text
              className="text-base font-poppins-bold text-foreground"
              numberOfLines={1}
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
            onPress={() => void handleDownload()}
            disabled={downloading || !fileId}
            accessibilityRole="button"
            accessibilityLabel="Descargar el documento"
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-70 disabled:opacity-50"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            {downloading ? (
              <Loader2 size={18} color={primaryColor} />
            ) : (
              <Download size={18} color={primaryColor} />
            )}
          </Pressable>
        </View>

        <View className="flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center gap-3">
              <ActivityIndicator size="large" color={primaryColor} />
              <Text className="text-sm font-poppins-medium text-muted-foreground">
                Cargando documento...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center gap-4 px-8">
              <View
                className="h-16 w-16 items-center justify-center rounded-[20px]"
                style={{ backgroundColor: "#F59E0B18" }}
              >
                <FileText size={30} color="#F59E0B" />
              </View>
              <Text className="text-base font-poppins-bold text-foreground text-center">
                {error}
              </Text>
              <Pressable
                onPress={() => void load()}
                accessibilityRole="button"
                accessibilityLabel="Reintentar la carga del documento"
                className="flex-row items-center gap-2 rounded-xl px-5 py-3 active:opacity-80"
                style={{ backgroundColor: primaryColor }}
              >
                <RotateCw size={16} color="#ffffff" />
                <Text className="text-sm font-poppins-bold text-white">
                  Reintentar
                </Text>
              </Pressable>
            </View>
          ) : url ? (
            <iframe
              src={url}
              title={label}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
