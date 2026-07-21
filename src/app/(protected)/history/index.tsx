import { Text } from "@/components/ui/text";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { router } from "expo-router";
import { ChevronRight, Folder, Search, RefreshCw } from "lucide-react-native";
import { useMemo, useState, useCallback, useEffect } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
  ActivityIndicator,
} from "react-native";
import { Input } from "@/components/ui/input";
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from "react-native-reanimated";

export default function HistoryYearsScreen() {
  const { documents, isLoading, isRefreshing, refetch } =
    useProcessedDocuments(true);
  const primaryColor = usePreferenceStore((s) => s.primaryColor) || "#002aff";
  const [search, setSearch] = useState("");

  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isRefreshing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [isRefreshing]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });


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
      <View className="px-6 py-3.5 flex-row items-center gap-3">
        <View className="flex-1 relative justify-center">
          <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
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
        <Pressable 
          onPress={() => refetch()}
          disabled={isRefreshing}
          className="w-11 h-11 bg-card rounded-2xl items-center justify-center border border-border/40"
          style={({pressed}) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Animated.View style={animatedStyle}>
            <RefreshCw size={20} color={primaryColor} />
          </Animated.View>
        </Pressable>
      </View>

      {isLoading && !isRefreshing ? (
        <View className="flex-1 px-6 pt-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="bg-card/50 rounded-2xl p-3.5 mb-3 border border-border/20 flex-row items-center">
              <View className="w-11 h-11 rounded-xl bg-muted/40 mr-3.5" />
              <View className="flex-1">
                <View className="h-5 bg-muted/40 rounded w-16 mb-2" />
                <View className="h-4 bg-muted/40 rounded w-24" />
              </View>
              <View className="w-5 h-5 bg-muted/40 rounded-full" />
            </View>
          ))}
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
