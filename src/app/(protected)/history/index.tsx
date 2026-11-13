import { PendingDocumentsSkeleton } from "@/components/documents/PendingDocumentsSkeleton";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { useOfflineDocuments } from "@/hooks/useOfflineDocuments";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { showToast } from "@/lib/toast";
import { router } from "expo-router";
import {
  ChevronRight,
  CloudDownload,
  Folder,
  Loader2,
  RotateCw,
  Search,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryYearsScreen() {
  const { documents, isLoading, isRefreshing, refetch, error } =
    useProcessedDocuments(true);
  const primaryColor = usePreferenceStore((s) => s.primaryColor) || "#002aff";
  const [search, setSearch] = useState("");
  const offline = useOfflineDocuments();

  const years = useMemo(() => {
    const uniqueYears = Array.from(
      new Set(documents.map((d) => d.PdcPeriodYear)),
    );
    const sortedYears = uniqueYears.sort((a, b) => parseInt(b) - parseInt(a));
    if (!search) return sortedYears;
    return sortedYears.filter((y) => y.toString().includes(search));
  }, [documents, search]);

  const filesByYear = useMemo(() => {
    const map = new Map<string, number>();
    for (const document of documents) {
      map.set(document.PdcPeriodYear, (map.get(document.PdcPeriodYear) ?? 0) + 1);
    }
    return map;
  }, [documents]);

  const cachedByYear = useMemo(() => {
    const map = new Map<string, number>();
    for (const document of documents) {
      if (!offline.isCached(document.PdcFilID)) continue;
      map.set(
        document.PdcPeriodYear,
        (map.get(document.PdcPeriodYear) ?? 0) + 1,
      );
    }
    return map;
  }, [documents, offline]);

  const cachedCount = useMemo(
    () => documents.filter((document) => offline.isCached(document.PdcFilID)).length,
    [documents, offline],
  );

  const monthsOf = (year: string) =>
    new Set(
      documents
        .filter((document) => document.PdcPeriodYear === year)
        .map((document) => document.PdcPeriodMonth),
    ).size;

  const allCached =
    documents.length > 0 &&
    documents.every((document) => offline.isCached(document.PdcFilID));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2 gap-3">
        <View className="w-full flex-row items-center gap-4 rounded-[24px] border border-border/40 bg-card p-4 shadow-sm">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: `${primaryColor}1f`,
              borderColor: `${primaryColor}3d`,
            }}
          >
            <Folder size={20} color={primaryColor} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-poppins-bold tracking-tight text-foreground">
                Historial
              </Text>
              <View className="rounded-full border border-border/40 bg-secondary/60 px-2 py-0.5">
                <Text className="text-[10px] font-poppins-bold uppercase tracking-wider text-muted-foreground">
                  {documents.length} doc{documents.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <Text className="text-xs font-poppins-medium text-muted-foreground">
              Consulta tus documentos por año y periodo
            </Text>
          </View>
          <Pressable
            onPress={() => void refetch()}
            disabled={isRefreshing}
            accessibilityRole="button"
            accessibilityLabel="Actualizar el historial"
            className="h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-secondary/50 active:opacity-70 disabled:opacity-50"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <RotateCw size={16} className="text-muted-foreground" />
            )}
          </Pressable>
        </View>

        <View className="relative justify-center">
          <Search
            size={20}
            className="absolute left-10 z-10 text-muted-foreground"
          />
          <Input
            className="h-12 rounded-[18px] border-border/40 bg-card pl-11 font-poppins text-base"
            placeholder="Buscar año..."
            placeholderTextColor="#71717a"
            value={search}
            onChangeText={setSearch}
            keyboardType="numeric"
          />
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
              accessibilityLabel="Guardar todo el historial para verlo sin conexion"
              className="flex-1 flex-row items-center gap-3 rounded-[18px] px-4 py-3 active:opacity-80 disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {offline.progress ? (
                <Loader2 size={18} color="#ffffff" />
              ) : (
                <CloudDownload size={18} color="#ffffff" />
              )}
              <View className="flex-1">
                <Text className="text-sm font-poppins-bold text-white">
                  {offline.progress
                    ? `Guardando ${offline.progress.done}/${offline.progress.total}`
                    : "Guardar todos mis documentos offline"}
                </Text>
                <Text className="text-[11px] font-poppins-medium text-white/80">
                  {cachedCount} de {documents.length} guardados · Toca para
                  descargar todo
                </Text>
              </View>
            </Pressable>

            {allCached ? (
              <View className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1.5">
                <Text className="text-[10px] font-poppins-bold uppercase tracking-wider text-emerald-600">
                  Todo offline
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {isLoading && !isRefreshing ? (
        <View className="flex-1 px-6 pt-3">
          <PendingDocumentsSkeleton />
        </View>
      ) : (
        <FlatList
          data={years}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
          renderItem={({ item, index }) => {
            const total = filesByYear.get(item) ?? 0;
            const cached = cachedByYear.get(item) ?? 0;
            const yearCached = total > 0 && cached === total;
            return (
              <Animated.View
                entering={
                  Platform.OS === "android"
                    ? undefined
                    : FadeInDown.delay(Math.min(index * 20, 140)).duration(220)
                }
              >
                <Pressable
                  onPress={() => router.push(`/history/${item}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver los documentos del año ${item}`}
                  className="mb-3 flex-row items-center rounded-[18px] border border-border/40 bg-card p-4 active:opacity-70"
                  style={
                    yearCached
                      ? { borderColor: "rgba(16,185,129,0.4)" }
                      : undefined
                  }
                >
                  <View
                    className="mr-4 h-12 w-12 items-center justify-center rounded-[14px] border"
                    style={{
                      backgroundColor: yearCached
                        ? "rgba(16,185,129,0.15)"
                        : `${primaryColor}10`,
                      borderColor: yearCached
                        ? "rgba(16,185,129,0.3)"
                        : `${primaryColor}30`,
                    }}
                  >
                    <Folder
                      size={24}
                      color={yearCached ? "#10B981" : primaryColor}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-poppins-bold text-foreground">
                      Año {item}
                    </Text>
                    <Text className="text-sm font-poppins-medium text-muted-foreground">
                      {monthsOf(item)} mes{monthsOf(item) !== 1 ? "es" : ""}{" "}
                      registrados
                    </Text>
                    {cached > 0 ? (
                      <Text className="text-xs font-poppins-medium text-muted-foreground">
                        {cached} de {total} guardados
                      </Text>
                    ) : null}
                  </View>
                  <View className="rounded-full border border-border/40 bg-secondary/60 px-2.5 py-1">
                    <Text className="text-[10px] font-poppins-bold uppercase tracking-wider text-muted-foreground">
                      {total} doc{total !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <ChevronRight size={20} className="text-muted-foreground" />
                </Pressable>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            !isLoading ? (
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
                  className="mb-6 h-24 w-24 items-center justify-center rounded-[32px]"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <Search
                    size={40}
                    color={primaryColor}
                    style={{ opacity: 0.6 }}
                  />
                </View>
                <Text className="mb-2 text-center text-xl font-poppins-bold text-foreground">
                  {error ? "No se pudieron cargar" : "Sin resultados"}
                </Text>
                <Text className="text-center text-sm font-poppins text-muted-foreground">
                  {error
                    ? `${error} Revisa tu conexion e intentalo de nuevo.`
                    : "No encontramos el año buscado."}
                </Text>
              </Animated.View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
