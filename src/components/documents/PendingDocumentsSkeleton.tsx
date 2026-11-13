import { useColorScheme } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import * as React from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SkeletonProps {
  className?: string;
}

/** Bloque con destello, para reemplazar el spinner durante la carga. */
export function Skeleton({ className }: SkeletonProps) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  const translateX = useSharedValue(-320);

  React.useEffect(() => {
    translateX.value = withRepeat(withTiming(700, { duration: 1200 }), -1, false);
  }, [translateX]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      className={`overflow-hidden rounded-xl bg-muted/40 ${className ?? ""}`}
    >
      <Animated.View style={[style, { position: "absolute", top: 0, bottom: 0, width: "60%" }]}>
        <LinearGradient
          colors={
            dark
              ? ["transparent", "rgba(255,255,255,0.12)", "transparent"]
              : ["transparent", "rgba(255,255,255,0.75)", "transparent"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: "100%", width: "100%" }}
        />
      </Animated.View>
    </View>
  );
}

/** Esqueleto de la lista de documentos pendientes. */
export function PendingDocumentsSkeleton() {
  return (
    <View className="w-full gap-3">
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className="flex-row items-center gap-3.5 rounded-[18px] border border-border/40 bg-card p-3.5"
        >
          <Skeleton className="h-11 w-11 rounded-[14px]" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </View>
        </View>
      ))}
    </View>
  );
}
