import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { CheckCircle2, CloudDownload } from "lucide-react-native";
import { ActivityIndicator, Pressable, View } from "react-native";

type Props = {
  total: number;
  cached: number;
  progress: { done: number; total: number } | null;
  primaryColor: string;
  onDownload: () => Promise<void>;
};

export function OfflineDownloadCard({
  total,
  cached,
  progress,
  primaryColor,
  onDownload,
}: Props) {
  const complete = total > 0 && cached === total;
  return (
    <View className="gap-3 rounded-2xl border border-border/40 bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View
          className={`h-10 w-10 items-center justify-center rounded-xl ${complete ? "bg-emerald-500/15" : "bg-secondary"}`}
        >
          <Icon
            as={complete ? CheckCircle2 : CloudDownload}
            size={20}
            color={complete ? "#10b981" : primaryColor}
          />
        </View>
        <View className="flex-1 gap-1" accessibilityLiveRegion="polite">
          <Text className="text-sm font-poppins-semibold text-foreground">
            {complete ? "Disponible sin conexión" : "Acceso sin conexión"}
          </Text>
          <Text className="text-xs font-poppins text-muted-foreground">
            {progress
              ? `Guardando ${progress.done} de ${progress.total}…`
              : `${cached} de ${total} documentos en este dispositivo`}
          </Text>
        </View>
      </View>
      <View
        className="h-1 overflow-hidden rounded-full bg-secondary"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: cached }}
      >
        <View
          style={{
            height: "100%",
            width: `${total ? (cached / total) * 100 : 0}%`,
            backgroundColor: complete ? "#10b981" : primaryColor,
          }}
        />
      </View>
      {!complete ? (
        <Pressable
          onPress={() => void onDownload()}
          disabled={progress !== null}
          accessibilityRole="button"
          accessibilityLabel="Guardar documentos pendientes sin conexión"
          className="min-h-11 flex-row items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2.5 active:opacity-70 disabled:opacity-60"
        >
          {progress ? (
            <ActivityIndicator size="small" color={primaryColor} />
          ) : (
            <CloudDownload size={16} color={primaryColor} />
          )}
          <Text className="text-xs font-poppins-semibold text-foreground">
            {progress
              ? "Descargando…"
              : cached > 0
                ? "Guardar los restantes"
                : "Guardar documentos"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
