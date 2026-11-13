import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { FileText, RotateCw } from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

interface DocumentsHeaderProps {
  pendingCount: number;
  refreshing: boolean;
  primaryColor: string;
  onRefresh: () => void;
}

/**
 * Encabezado de los documentos pendientes: icono, titulo, pastilla con el
 * numero de pendientes y accion de actualizar a la derecha.
 */
export function DocumentsHeader({
  pendingCount,
  refreshing,
  primaryColor,
  onRefresh,
}: DocumentsHeaderProps) {
  return (
    <View className="w-full flex-row items-center gap-4 rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl border"
        style={{
          backgroundColor: `${primaryColor}15`,
          borderColor: `${primaryColor}30`,
        }}
      >
        <FileText size={20} color={primaryColor} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-poppins-bold tracking-tight text-foreground">
            Documentos
          </Text>
          <View className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5">
            <Text className="text-[10px] font-poppins-bold uppercase tracking-wider text-amber-600">
              {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <Text className="text-xs font-poppins-medium text-muted-foreground">
          Revisa y confirma la recepción de tus documentos
        </Text>
      </View>

      <Pressable
        onPress={onRefresh}
        disabled={refreshing}
        accessibilityRole="button"
        accessibilityLabel="Actualizar la lista de documentos"
        className="h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-secondary/40 active:opacity-70 disabled:opacity-50"
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={primaryColor} />
        ) : (
          <Icon as={RotateCw} size={16} className="text-muted-foreground" />
        )}
      </Pressable>
    </View>
  );
}
