import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useOfflineDocuments } from "@/hooks/useOfflineDocuments";
import { toOfflineInput } from "@/services/offlineDocuments";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { showToast } from "@/lib/toast";
import { saveDocumentToDevice } from "@/services/documentDownload";
import DocumentViewerModal from "@/components/documents/DocumentViewerModal";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { ProcessedDocument } from "@/types/document";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  CloudDownload,
  FileText,
  Loader2,
  WifiOff,
} from "lucide-react-native";
import * as React from "react";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HistoryMonthDocumentsScreen() {
  const { year, month } = useLocalSearchParams<{
    year: string;
    month: string;
  }>();
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor = storePrimaryColor || "#002aff";

  const {
    documents: allDocuments,
    isLoading,
    isRefreshing,
    refetch,
    error,
  } = useProcessedDocuments(true);
  const offline = useOfflineDocuments();

  const documents = useMemo(() => {
    if (!allDocuments) return [];
    return allDocuments.filter(
      (d) =>
        d.PdcPeriodYear.toString() === year &&
        d.PdcPeriodMonth.toLowerCase() === month?.toLowerCase(),
    );
  }, [allDocuments, year, month]);

  // Sin conexion la lista llega vacia: se muestran los documentos que ya
  // estaban guardados en el dispositivo.
  const offlineList = React.useMemo<ProcessedDocument[]>(() => {
    if (!error || offline.offlineDocuments.length === 0) return [];
    const targetMonth =
      month?.charAt(0).toUpperCase() + month?.slice(1).toLowerCase();
    return offline.offlineDocuments
      .filter(item => {
        if (!item.periodYear || !item.periodMonth) return false;
        return (
          item.periodYear.toString() === year &&
          (item.periodMonth.charAt(0).toUpperCase() +
            item.periodMonth.slice(1).toLowerCase()) ===
            targetMonth
        );
      })
      .map(item => ({
        PdcID: item.fileId,
        PrsID: 0,
        PdcPeriodYear: item.periodYear ?? "",
        PdcPeriodMonth: item.periodMonth ?? "",
        PdcPeriodWeek: null,
        PdcFilID: item.fileId,
        SecStatus: 1,
        CreateUserId: 0,
        UpdateUserId: null,
        DeleteUserId: null,
        CreateDate: new Date(item.savedAt).toISOString(),
        UpdateDate: null,
        DeleteDate: null,
        PdcIsReceived: false,
        DprID: 0,
        DprDisplayName: item.title,
      }));
  }, [error, offline.offlineDocuments, year, month]);

  const listData = documents.length > 0 ? documents : offlineList;

  // En web el documento se muestra embebido en la app (el visor usa un iframe
  // con el blob descargado con la sesion). En nativo no hay visor PDF
  // embebido: se entrega al visor del sistema, porque la URL de GenFiles exige
  // Authorization y el navegador externo no la lleva.
  const [viewerFileId, setViewerFileId] = React.useState<number | null>(null);
  const [viewerDocument, setViewerDocument] =
    React.useState<ProcessedDocument | null>(null);

  const handleOpenPdf = async (
    fileId: number,
    document?: ProcessedDocument
  ) => {
    if (Platform.OS === "web") {
      setViewerDocument(document ?? null);
      setViewerFileId(fileId);
      return;
    }
    try {
      await saveDocumentToDevice(
        fileId,
        document?.DprDisplayName || "documento"
      );
    } catch {
      showToast.error("Error", "No se pudo abrir el documento.");
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
          onPress={() => void handleOpenPdf(item.PdcFilID, item)}
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

          {offline.isCached(item.PdcFilID) ? (
            <View className="mr-1.5 flex-row items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1">
              <CheckCircle2 size={12} color="#10B981" />
              <Text className="text-[10px] font-poppins-bold uppercase tracking-wider text-emerald-600">
                Listo offline
              </Text>
            </View>
          ) : null}
          <View className="h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-secondary/50">
            <ChevronRight size={16} className="text-muted-foreground" />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Detalles por mes" }} />
      <View className="flex-1 bg-background pt-4">
        <View className="px-6 pb-3 gap-3">
          <View className="w-full flex-row items-center gap-4 rounded-[24px] border border-border/40 bg-card p-4 shadow-sm">
            <View
              className="h-11 w-11 items-center justify-center rounded-2xl border"
              style={{
                backgroundColor: `${primaryColor}15`,
                borderColor: `${primaryColor}30`,
              }}
            >
              <FileText size={20} color={primaryColor} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-poppins-bold capitalize tracking-tight text-foreground">
                {month} {year}
              </Text>
              <Text className="text-xs font-poppins-medium text-muted-foreground">
                {documents.length} documento
                {documents.length !== 1 ? "s" : ""} recibido
                {documents.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {documents.length > 0 ? (
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={async () => {
                  const result = await offline.cacheAll(
                    documents.map(toOfflineInput),
                  );
                  if (result.failed > 0)
                    showToast.error(
                      "Error",
                      `${result.failed} documento(s) no se pudieron guardar.`,
                    );
                  else if (result.done > 0)
                    showToast.success(
                      "Documentos guardados",
                      "Ya puedes verlos sin conexion.",
                    );
                }}
                disabled={offline.progress !== null}
                accessibilityRole="button"
                accessibilityLabel="Guardar los documentos del mes para verlos sin conexion"
                className="flex-row items-center gap-2 rounded-[14px] border border-border/40 bg-card px-3.5 py-2 active:opacity-70 disabled:opacity-50"
              >
                {offline.progress ? (
                  <Loader2 size={14} className="text-muted-foreground" />
                ) : (
                  <CloudDownload size={14} className="text-muted-foreground" />
                )}
                <Text className="text-xs font-poppins-semibold text-foreground">
                  {offline.progress
                    ? `Guardando ${offline.progress.done}/${offline.progress.total}`
                    : "Guardar mes"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        {offlineList.length > 0 ? (
          <View className="mx-6 mb-2 flex-row items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
            <WifiOff size={14} color="#F59E0B" />
            <Text className="flex-1 text-xs font-poppins-medium text-foreground">
              Sin conexión: se muestran los documentos guardados en este dispositivo.
            </Text>
          </View>
        ) : null}

        {isLoading && !isRefreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="mt-4 font-poppins text-muted-foreground text-sm">
              Cargando historial...
            </Text>
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
              error && offlineList.length === 0 ? (
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
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <FileText
                      size={40}
                      color={primaryColor}
                      style={{ opacity: 0.6 }}
                    />
                  </View>
                  <Text className="text-xl font-poppins-bold text-foreground text-center mb-2">
                    Sin registros
                  </Text>
                  <Text className="text-sm font-poppins text-muted-foreground text-center max-w-[250px] leading-5">
                    Aún no tienes documentos en tu historial de recepción.
                  </Text>
                </Animated.View>
              )
            }
          />
        )}
      </View>

      <DocumentViewerModal
        visible={viewerFileId !== null}
        fileId={viewerFileId}
        fileName={viewerDocument?.DprDisplayName}
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
    </>
  );
}
