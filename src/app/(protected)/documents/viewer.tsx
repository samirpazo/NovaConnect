import PDFViewer from "@/components/PDFViewer";
import { showToast } from "@/lib/toast";
import { processedDocumentService } from "@/services/processedDocumentService";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import * as FileSystem from "expo-file-system/legacy";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import * as Sharing from "expo-sharing";
import { ChevronLeft, Download } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DocumentViewerScreen() {
  const pathname = usePathname();
  const {
    fileName,
    title,
    returnTo,
  } = useLocalSearchParams<{
    fileName: string;
    title: string;
    returnTo?: string;
  }>();
  const { primaryColor } = usePreferenceStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPdf();
  }, [fileName]);

  const loadPdf = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!fileName || typeof fileName !== "string") {
        throw new Error("Nombre de archivo no válido");
      }

      if (Platform.OS === "web") {
        // En web, descargamos el blob y creamos un object URL para el iframe
        const response = await processedDocumentService.getPdfBlob(fileName);
        const blobUrl = window.URL.createObjectURL(response);
        setPdfUrl(blobUrl);
      } else {
        // En nativo, react-native-webview puede cargar la URL directamente
        const url = processedDocumentService.getPdfUrl(fileName);
        setPdfUrl(url);
      }
    } catch (err) {
      console.error("Error cargando PDF:", err);
      setError("No se pudo cargar el documento.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fileName || typeof fileName !== "string") return;
    try {
      const safeFileName = fileName.split("/").pop() || "Documento.pdf";

      if (Platform.OS === "web") {
        const response = await processedDocumentService.getPdfBlob(fileName);
        const blobUrl = window.URL.createObjectURL(response);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = safeFileName;
        link.click();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        const response = await processedDocumentService.getPdfBlob(fileName);
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(response);
        });

        const fileUri = `${FileSystem.cacheDirectory}${safeFileName}`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: "Descargar o compartir PDF",
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error) {
      console.error("Error al descargar:", error);
      showToast.error("Error", "No se pudo descargar el documento.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/40">
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === "web") {
              if (returnTo) {
                router.replace(returnTo as any);
              } else {
                const segments = pathname.split("/").filter(Boolean);
                segments.pop();
                const parentPath = "/" + segments.join("/");
                router.replace(parentPath as any);
              }
            } else {
              router.back();
            }
          }}
          className="w-10 h-10 items-center justify-center rounded-full bg-secondary/50"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>

        <View className="flex-1 px-4">
          <Text
            className="text-base font-poppins-semibold text-foreground text-center"
            numberOfLines={1}
          >
            {title ||
              (typeof fileName === "string"
                ? fileName.split("/").pop()
                : "Documento")}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleDownload}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${primaryColor || "#002aff"}15` }}
        >
          <Download size={20} color={primaryColor || "#002aff"} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={primaryColor || "#002aff"} />
            <Text className="mt-4 font-poppins text-muted-foreground text-sm">
              Cargando documento...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-destructive font-poppins-semibold text-center mb-4">
              {error}
            </Text>
            <TouchableOpacity
              onPress={loadPdf}
              className="px-6 py-3 rounded-full"
              style={{ backgroundColor: primaryColor || "#002aff" }}
            >
              <Text className="text-primary-foreground font-poppins-semibold">
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        ) : pdfUrl ? (
          <PDFViewer uri={pdfUrl} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
