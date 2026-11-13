import { Text } from "@/components/ui/text";
import { CheckCircle2, RotateCw } from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

interface PendingEmptyStateProps {
  refreshing: boolean;
  primaryColor: string;
  onRefresh: () => void;
}

/**
 * Estado vacio de los documentos pendientes: un anillo de check con el texto
 * "Todo al dia" y un boton para comprobar si hay novedades.
 */
export function PendingEmptyState({
  refreshing,
  primaryColor,
  onRefresh,
}: PendingEmptyStateProps) {
  return (
    <View
      className="w-full items-center rounded-2xl border border-border/40 bg-card px-6 py-10 shadow-sm"
    >
      <View style={{ alignSelf: "center" }} className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-500/25">
          <CheckCircle2 size={40} color="#10B981" />
        </View>
      </View>

      <Text className="mb-2 text-center text-xl font-poppins-bold tracking-tight text-foreground">
        ¡Todo al día!
      </Text>
      <Text className="text-center text-sm font-poppins-medium text-muted-foreground">
        No tienes documentos pendientes de confirmación.
      </Text>

      <Pressable
        onPress={onRefresh}
        disabled={refreshing}
        accessibilityRole="button"
        accessibilityLabel="Comprobar si hay documentos nuevos"
        className="mt-6 self-center flex-row items-center gap-2 rounded-xl border border-border/40 bg-muted/60 px-4 py-2.5 active:opacity-70 disabled:opacity-60"
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={primaryColor} />
        ) : (
          <RotateCw size={16} color={primaryColor} />
        )}
        <Text
          className="text-xs font-poppins-bold"
          style={{ color: primaryColor }}
        >
          {refreshing ? "Comprobando..." : "Comprobar nuevos"}
        </Text>
      </Pressable>
    </View>
  );
}
