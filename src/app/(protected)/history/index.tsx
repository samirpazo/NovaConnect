import { Text } from "@/components/ui/text";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { router } from "expo-router";
import { ChevronRight, Folder, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { Input } from "@/components/ui/input";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 relative justify-center">
        <Search size={20} className="absolute left-10 text-muted-foreground z-10" />
        <Input
          className="pl-11 h-12 rounded-[18px] bg-card border-border/40 font-poppins text-base"
          placeholder="Buscar año..."
          placeholderTextColor="#71717a"
          value={search}
          onChangeText={setSearch}
          keyboardType="numeric"
        />
      </View>

      <FlatList
        data={years}
        keyExtractor={(item) => item.toString()}
        contentContainerStyle={{
          paddingHorizontal: 24,
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
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <Pressable
              onPress={() => router.push(`/history/${item}`)}
              className="bg-card rounded-[18px] p-4 mb-3 border border-border/40 flex-row items-center active:opacity-70"
            >
              <View className="w-12 h-12 rounded-[14px] items-center justify-center bg-background border border-border/40 mr-4">
                <Folder size={24} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-poppins-bold text-foreground">
                  {item}
                </Text>
                <Text className="text-sm font-poppins-medium text-muted-foreground">
                  Carpeta • Año {item}
                </Text>
              </View>
              <ChevronRight size={20} className="text-muted-foreground" />
            </Pressable>
          </Animated.View>
        )}
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
    </SafeAreaView>
  );
}
