import { Text } from "@/components/ui/text";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Calendar, ChevronRight } from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, Pressable, View, TouchableOpacity } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft } from "lucide-react-native";

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
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        {/* Custom Header */}
        <View className="flex-row items-center px-4 py-2.5 border-b border-border">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
            className="w-8 h-8 items-center justify-center rounded-full bg-secondary"
          >
            <ChevronLeft size={20} color={primaryColor} />
          </Pressable>
          <View className="flex-1 px-3">
            <Text className="text-lg font-poppins-semibold text-foreground">
              Año {year}
            </Text>
          </View>
        </View>
        <FlatList
          data={monthsInfo}
          keyExtractor={(item) => item.month}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 12 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
              <Pressable
                onPress={() => router.push(`/history/${year}/${item.month}`)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
                className="bg-card rounded-2xl p-3.5 mb-3 border border-border/40 flex-row items-center"
              >
                <View className="w-11 h-11 rounded-xl items-center justify-center bg-background border border-border/40 mr-3.5">
                  <Calendar size={22} color={primaryColor} />
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
                <ChevronRight size={20} color="#71717a" />
              </Pressable>
            </Animated.View>
          )}
        />
      </View>
    </>
  );
}
