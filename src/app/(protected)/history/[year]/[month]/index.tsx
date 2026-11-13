import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useOfflineDocuments } from "@/hooks/useOfflineDocuments";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { showToast } from "@/lib/toast";
import { openDocument } from "@/services/documentDownload";
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

  // El documento se descarga con la credencial y se abre con el visor del
  // sistema: la URL de GenFiles exige Authorization y el navegador externo no
  // la lleva.
  const handleOpenPdf = async (fileId: number) => {
    try {
      await openDocument(fileId);
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
          onPress={() => handleOpenPdf(item.PdcFilID)}
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

          {Platform.OS !== "web" && documents.length > 0 ? (
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={async () => {
                  const result = await offline.cacheAll(
                    documents.map((document) => document.PdcFilID),
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
        {isLoading && !isRefreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="mt-4 font-poppins text-muted-foreground text-sm">
              Cargando historial...
            </Text>
          </View>
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.PdcID.toString()}
            renderItem={renderItem}
            contentContainerStyle={{
              padding: 24,
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
              error ? (
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
    </>
  );
}
