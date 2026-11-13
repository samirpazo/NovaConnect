import { Text } from "@/components/ui/text";
import { useOfflineDocuments } from "@/hooks/useOfflineDocuments";
import { toOfflineInput } from "@/services/offlineDocuments";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { showToast } from "@/lib/toast";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  Calendar,
  ChevronRight,
  CloudDownload,
  Loader2,
} from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, Platform, Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HistoryMonthsScreen() {
  const { year } = useLocalSearchParams<{ year: string }>();
  const { documents } = useProcessedDocuments(true);
  const primaryColor = usePreferenceStore((s) => s.primaryColor) || "#002aff";
  const offline = useOfflineDocuments();

  const monthsInfo = useMemo(() => {
    const yearDocs = documents.filter(
      (d) => d.PdcPeriodYear.toString() === year,
    );

    const monthCounts = yearDocs.reduce(
      (acc, doc) => {
        const month =
          doc.PdcPeriodMonth.charAt(0).toUpperCase() +
          doc.PdcPeriodMonth.slice(1).toLowerCase();
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const monthOrder = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const monthCached = yearDocs.reduce(
      (acc, doc) => {
        const month =
          doc.PdcPeriodMonth.charAt(0).toUpperCase() +
          doc.PdcPeriodMonth.slice(1).toLowerCase();
        if (offline.isCached(doc.PdcFilID))
          acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.keys(monthCounts)
      .map((month) => ({
        month,
        count: monthCounts[month],
        cached: monthCached[month] ?? 0,
      }))
      .sort((a, b) => {
        const idxA = monthOrder.indexOf(a.month);
        const idxB = monthOrder.indexOf(b.month);
        return idxB - idxA;
      });
  }, [documents, year, offline]);

  return (
    <>
      <Stack.Screen options={{ title: `Año ${year}` }} />
      <View className="flex-1 bg-background">
        <FlatList
          data={monthsInfo}
          keyExtractor={(item) => item.month}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          renderItem={({ item, index }) => {
            const monthCached = item.count > 0 && item.cached === item.count;
            return (
              <Animated.View
                entering={
                  Platform.OS === "android"
                    ? undefined
                    : FadeInDown.delay(Math.min(index * 20, 140)).duration(220)
                }
              >
                <Pressable
                  onPress={() => router.push(`/history/${year}/${item.month}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver los documentos de ${item.month}`}
                  className="mb-3 flex-row items-center rounded-[18px] border border-border/40 bg-card p-4 active:opacity-70"
                  style={
                    monthCached
                      ? { borderColor: "rgba(16,185,129,0.4)" }
                      : undefined
                  }
                >
                  <View
                    className="mr-4 h-12 w-12 items-center justify-center rounded-[14px] border"
                    style={{
                      backgroundColor: monthCached
                        ? "rgba(16,185,129,0.15)"
                        : `${primaryColor}10`,
                      borderColor: monthCached
                        ? "rgba(16,185,129,0.3)"
                        : `${primaryColor}30`,
                    }}
                  >
                    <Calendar
                      size={24}
                      color={monthCached ? "#10B981" : primaryColor}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-poppins-bold text-foreground">
                      {item.month}
                    </Text>
                    <Text className="text-sm font-poppins-medium text-muted-foreground">
                      {item.count}{" "}
                      {item.count === 1 ? "documento" : "documentos"}
                      {item.cached > 0 ? ` · ${item.cached} offline` : ""}
                    </Text>
                  </View>
                  {!monthCached ? (
                    <Pressable
                      onPress={async () => {
                        const result = await offline.cacheAll(
                          documents
                            .filter(
                              (document) =>
                                document.PdcPeriodYear.toString() === year &&
                                (document.PdcPeriodMonth.charAt(0).toUpperCase() +
                                  document.PdcPeriodMonth.slice(1).toLowerCase()) ===
                                  item.month,
                            )
                            .map(toOfflineInput),
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
                      disabled={offline.downloadingId !== null}
                      accessibilityRole="button"
                      accessibilityLabel={`Guardar los documentos de ${item.month} para verlos sin conexion`}
                      className="mr-1 h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-secondary/50 active:opacity-70"
                    >
                      {offline.downloadingId !== null ? (
                        <Loader2 size={15} className="text-muted-foreground" />
                      ) : (
                        <CloudDownload size={15} className="text-muted-foreground" />
                      )}
                    </Pressable>
                  ) : null}
                  <ChevronRight size={20} className="text-muted-foreground" />
                </Pressable>
              </Animated.View>
            );
          }}
        />
      </View>
    </>
  );
}
