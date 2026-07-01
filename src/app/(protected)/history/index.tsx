import { Text } from "@/components/ui/text";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { router } from "expo-router";
import { ChevronRight, Folder, Search } from "lucide-react-native";
import { useMemo, useState, useCallback } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
  ActivityIndicator,
} from "react-native";
import { Input } from "@/components/ui/input";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HistoryYearsScreen() {
  const { documents, isLoading, isRefreshing, refetch } =
    useProcessedDocuments(true);
  const primaryColor = usePreferenceStore((s) => s.primaryColor) || "#002aff";
  const [search, setSearch] = useState("");

  const years = useMemo(() => {
    const uniqueYears = Array.from(
      new Set(documents.map((d) => d.PdcPeriodYear)),
    );
    const sortedYears = uniqueYears.sort((a, b) => parseInt(b) - parseInt(a));
    if (!search) return sortedYears;
    return sortedYears.filter((y) => y.toString().includes(search));
  }, [documents, search]);

  const renderYearItem = useCallback(({ item, index }: { item: string | number; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Pressable
        onPress={() => router.push(`/history/${item}`)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
        className="bg-card rounded-2xl p-3.5 mb-3 border border-border/40 flex-row items-center"
      >
        <View className="w-11 h-11 rounded-xl items-center justify-center bg-background border border-border/40 mr-3.5">
          <Folder size={22} color={primaryColor} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-poppins-bold text-foreground">
            {item}
          </Text>
          <Text className="text-sm font-poppins-medium text-muted-foreground">
            Carpeta • Año {item}
          </Text>
        </View>
        <ChevronRight size={20} color="#71717a" />
      </Pressable>
    </Animated.View>
  ), [primaryColor]);

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 py-3.5 relative justify-center">
        <View className="absolute left-10 top-0 bottom-0 justify-center z-10">
          <Search size={18} color="#71717a" />
        </View>
        <Input
          className="pl-11 h-11 rounded-2xl bg-card border-border/40 font-poppins text-base"
          placeholder="Buscar año..."
          placeholderTextColor="#71717a"
          value={search}
          onChangeText={setSearch}
          keyboardType="numeric"
        />
      </View>

      {isLoading && !isRefreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-4 font-poppins text-muted-foreground text-sm">
            Buscando historial...
          </Text>
        </View>
      ) : (
        <FlatList
          data={years}
          keyExtractor={(item) => item.toString()}
          renderItem={renderYearItem}
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
                  className="w-24 h-24 rounded-[32px] items-center justify-center mb-6"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <Search
                    size={40}
                    color={primaryColor}
                    style={{ opacity: 0.6 }}
                  />
                </View>
                <Text className="text-xl font-poppins-bold text-foreground text-center mb-2">
                  Sin resultados
                </Text>
                <Text className="text-sm font-poppins text-muted-foreground text-center max-w-[250px] leading-5">
                  No encontramos el año buscado.
                </Text>
              </Animated.View>
            ) : null
          }
        />
      )}
    </View>
  );
}
