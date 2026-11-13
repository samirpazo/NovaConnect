import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import {
  Calendar,
  ChevronRight,
  FileText,
  WifiOff,
} from "lucide-react-native";
import {
  View,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmReceptionModal } from "@/components/documents/ConfirmReceptionModal";
import { DocumentsHeader } from "@/components/documents/DocumentsHeader";
import { PendingDocumentsSkeleton } from "@/components/documents/PendingDocumentsSkeleton";
import { PendingEmptyState } from "@/components/documents/PendingEmptyState";
import { useNetwork } from "@/hooks/useNetwork";
import {
  offlineDocumentsService,
  toOfflineInput,
} from "@/services/offlineDocuments";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { saveDocumentToDevice } from "@/services/documentDownload";
import DocumentViewerModal from "@/components/documents/DocumentViewerModal";
import { processedDocumentService } from "@/services/processedDocumentService";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ProcessedDocument } from "@/types/document";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import * as React from "react";

export default function DocumentsScreen() {
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor = storePrimaryColor || "#002aff";

  const { documents, isLoading, isRefreshing, refetch, error } =
    useProcessedDocuments(false);
  const isOnline = useNetwork();

  const listData = documents;
  const [confirming, setConfirming] = React.useState(false);

  // En web el documento se muestra embebido en la app (el visor usa un iframe
  // con el blob descargado con la sesion). En nativo no hay visor PDF
  // embebido: se entrega al visor del sistema, porque la URL de GenFiles exige
  // Authorization y el navegador externo no la lleva.
  const [viewerFileId, setViewerFileId] = React.useState<number | null>(null);
  const [viewerDocument, setViewerDocument] =
    React.useState<ProcessedDocument | null>(null);

  const handleOpenPdf = async (
    fileId: number,
    document?: ProcessedDocument,
  ) => {
    if (Platform.OS === "web") {
      setViewerDocument(document ?? null);
      setViewerFileId(fileId);
      return;
    }
    try {
      await saveDocumentToDevice(
        fileId,
        document?.DprDisplayName || "documento",
      );
      if (document)
        await offlineDocumentsService.upsert(toOfflineInput(document));
    } catch {
      showToast.error("Error", "No se pudo abrir el documento.");
    }
  };

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedDocument, setSelectedDocument] =
    React.useState<ProcessedDocument | null>(null);

  const handleDocumentPress = (item: ProcessedDocument) => {
    if (!isOnline || item.PdcIsReceived) return;
    setSelectedDocument(item);
    setIsModalVisible(true);
  };

  const confirmReception = async () => {
    if (!selectedDocument || selectedDocument.PdcIsReceived || !isOnline)
      return;
    setConfirming(true);
    try {
      const success =
        await processedDocumentService.receiveDocument(selectedDocument);
      if (success) {
        setIsModalVisible(false);
        showToast.success(
          "Documento recepcionado",
          "El documento se ha movido a tu historial.",
        );
        refetch();
        await handleOpenPdf(selectedDocument.PdcFilID, {
          ...selectedDocument,
          PdcIsReceived: true,
        });
      } else {
        showToast.error("Error", "No se pudo recepcionar el documento.");
      }
    } catch {
      showToast.error("Error", "Ocurrió un problema al procesar la solicitud.");
    } finally {
      setConfirming(false);
      setSelectedDocument(null);
    }
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: ProcessedDocument;
    index: number;
  }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <Pressable
          onPress={() => handleDocumentPress(item)}
          className="bg-card rounded-[18px] p-3.5 mb-3 border border-border/40 shadow-sm flex-row items-center active:opacity-70"
        >
          <View
            className="w-11 h-11 rounded-[14px] items-center justify-center mr-3.5"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <FileText size={20} color={primaryColor} />
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-sm font-poppins-semibold text-foreground mb-0.5 tracking-tight">
              {item.DprDisplayName || "Documento"}
            </Text>
            <View className="flex-row items-center">
              <Calendar size={12} className="text-muted-foreground mr-1" />
              <Text className="text-[11px] font-poppins-medium text-muted-foreground capitalize">
                {item.PdcPeriodMonth} {item.PdcPeriodYear}
              </Text>

            </View>
          </View>

          <View className="w-8 h-8 rounded-full bg-secondary/50 items-center justify-center border border-border/50">
            <ChevronRight size={16} className="text-muted-foreground" />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  if (!isOnline) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="px-6 pt-4">
          <Text className="text-xl font-poppins-bold text-foreground">Documentos</Text>
          <View className="mt-6 items-center gap-4 rounded-2xl border border-border/40 bg-card px-6 py-8">
            <WifiOff size={32} color={primaryColor} />
            <Text className="text-center text-lg font-poppins-semibold text-foreground">Los pendientes requieren conexión</Text>
            <Text className="text-center text-sm font-poppins text-muted-foreground">Conéctate para consultar y confirmar su recepción. Tus documentos recibidos están en Historial.</Text>
            <Button variant="outline" onPress={() => router.push("/(protected)/history")}>
              <Text>Ver historial</Text>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-6 pt-4 pb-2 gap-3">
        <DocumentsHeader
          pendingCount={documents.length}
          refreshing={isRefreshing}
          primaryColor={primaryColor}
          onRefresh={() => void refetch()}
        />
      </View>


      {isLoading && !isRefreshing ? (
        <View className="flex-1 px-6 pt-4">
          <PendingDocumentsSkeleton />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => String(item.PdcFilID || item.PdcID)}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 4,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
          ListEmptyComponent={
            error && documents.length === 0 ? (
              <Animated.View
                entering={FadeInDown.springify()}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 80,
                }}
              >
                <View
                  className="w-24 h-24 rounded-[32px] items-center justify-center mb-6"
                  style={{ backgroundColor: "#F59E0B18" }}
                >
                  <WifiOff size={40} color="#F59E0B" style={{ opacity: 0.7 }} />
                </View>
                <Text className="text-xl font-poppins-bold text-foreground text-center mb-2">
                  No se pudieron cargar
                </Text>
                <Text className="text-sm font-poppins text-muted-foreground text-center max-w-[280px] leading-5">
                  {error} Revisa tu conexion e intentalo de nuevo.
                </Text>
                <Button
                  variant="outline"
                  onPress={() => refetch()}
                  className="mt-5 px-6"
                >
                  <Text>Reintentar</Text>
                </Button>
              </Animated.View>
            ) : (
              <PendingEmptyState
                offline={!isOnline}
                refreshing={isRefreshing}
                primaryColor={primaryColor}
                onRefresh={() => void refetch()}
              />
            )
          }
        />
      )}

      <DocumentViewerModal
        visible={viewerFileId !== null}
        fileId={viewerFileId}
        fileName={viewerDocument?.DprDisplayName}
        periodMonth={viewerDocument?.PdcPeriodMonth}
        periodYear={viewerDocument?.PdcPeriodYear}
        isReceived={viewerDocument ? !!viewerDocument.PdcIsReceived : undefined}
        title={viewerDocument?.DprDisplayName}
        subtitle={
          viewerDocument
            ? `${viewerDocument.PdcPeriodMonth} ${viewerDocument.PdcPeriodYear}`
            : undefined
        }
        onClose={() => {
          setViewerFileId(null);
          setViewerDocument(null);
        }}
      />

      <ConfirmReceptionModal
        visible={isModalVisible}
        documentLabel={selectedDocument?.DprDisplayName}
        periodLabel={
          selectedDocument
            ? `${selectedDocument.PdcPeriodMonth} ${selectedDocument.PdcPeriodYear}`
            : undefined
        }
        offline={!isOnline}
        confirming={confirming}
        primaryColor={primaryColor}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedDocument(null);
        }}
        onConfirm={() => void confirmReception()}
      />
    </SafeAreaView>
  );
}
