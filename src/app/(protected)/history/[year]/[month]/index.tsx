import { Text } from "@/components/ui/text";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { showToast } from "@/lib/toast";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { ProcessedDocument } from "@/types/document";
import { Stack, useLocalSearchParams, router, RelativePathString } from "expo-router";
import { Calendar, CheckCircle2, FileText, ChevronLeft } from "lucide-react-native";
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
  } = useProcessedDocuments(true);

  const documents = useMemo(() => {
    if (!allDocuments) return [];
    return allDocuments.filter(
      (d) =>
        d.PdcPeriodYear.toString() === year &&
        d.PdcPeriodMonth.toLowerCase() === month?.toLowerCase(),
    );
  }, [allDocuments, year, month]);

  const handleOpenPdf = async (fileId: number, title?: string, periodMonth?: string, periodYear?: string) => {
    try {
      router.push({
        pathname: "/(protected)/history/viewer",
        params: { fileId: String(fileId), title: title || "Documento", periodMonth, periodYear },
      });
    } catch (error) {
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
          onPress={() => handleOpenPdf(item.PdcFilID, item.DprDisplayName, item.PdcPeriodMonth, item.PdcPeriodYear)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
          className="bg-card rounded-2xl p-3.5 mb-3 border border-border/40 shadow-sm flex-row items-center"
        >
          <View
            className="w-11 h-11 rounded-xl items-center justify-center mr-3.5"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <FileText size={22} color={primaryColor} />
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-base font-poppins-semibold text-foreground mb-0.5 tracking-tight">
              {item.DprDisplayName || "Documento"}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Calendar size={14} color="#71717a" />
              <Text className="text-sm font-poppins-medium text-muted-foreground capitalize">
                {item.PdcPeriodMonth} {item.PdcPeriodYear}
              </Text>
            </View>
          </View>

          <View className="w-8 h-8 rounded-full bg-green-500/10 items-center justify-center border border-green-500/20">
            <CheckCircle2
              size={16}
              color="#22c55e"
            />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        {/* Custom Header */}
        <View className="flex-row items-center px-4 py-2.5 border-b border-border">
          <Pressable
            onPress={() => {
              if (Platform.OS === "web") {
                router.replace(`/(protected)/history/${year}` as unknown as RelativePathString);
              } else {
                router.back();
              }
            }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
            className="w-8 h-8 items-center justify-center rounded-full bg-secondary"
          >
            <ChevronLeft size={20} color={primaryColor} />
          </Pressable>
          <View className="flex-1 px-3">
            <Text className="text-lg font-poppins-semibold text-foreground">
              Detalles por mes
            </Text>
          </View>
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
              paddingHorizontal: 24,
              paddingTop: 12,
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
            }
          />
        )}
      </View>
    </>
  );
}
