import { Text } from "@/components/ui/text";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Calendar, ChevronRight } from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HistoryMonthsScreen() {
  const { year } = useLocalSearchParams<{ year: string }>();
  const { documents } = useProcessedDocuments(true);
  const primaryColor = usePreferenceStore((s) => s.primaryColor) || "#002aff";

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

    return Object.keys(monthCounts)
      .map((month) => ({ month, count: monthCounts[month] }))
      .sort((a, b) => {
        const idxA = monthOrder.indexOf(a.month);
        const idxB = monthOrder.indexOf(b.month);
        return idxB - idxA;
      });
  }, [documents, year]);

  return (
    <>
      <Stack.Screen options={{ title: `Año ${year}` }} />
      <View className="flex-1 bg-background">
        <FlatList
          data={monthsInfo}
          keyExtractor={(item) => item.month}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
              <Pressable
                onPress={() => router.push(`/history/${year}/${item.month}`)}
                className="bg-card rounded-[18px] p-4 mb-3 border border-border/40 flex-row items-center active:opacity-70"
              >
                <View className="w-12 h-12 rounded-[14px] items-center justify-center bg-background border border-border/40 mr-4">
                  <Calendar size={24} color={primaryColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-poppins-bold text-foreground">
                    {item.month}
                  </Text>
                  <Text className="text-sm font-poppins-medium text-muted-foreground">
                    {item.count} {item.count === 1 ? "documento" : "documentos"}{" "}
                    • Mes {item.month}
                  </Text>
                </View>
                <ChevronRight size={20} className="text-muted-foreground" />
              </Pressable>
            </Animated.View>
          )}
        />
      </View>
    </>
  );
}
