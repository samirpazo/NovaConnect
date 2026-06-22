import { Text } from "@/components/ui/text";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Clock } from "lucide-react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryScreen() {
  const { primaryColor } = usePreferenceStore();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="w-20 h-20 rounded-2xl items-center justify-center mb-5"
          style={{ backgroundColor: `${primaryColor || "#002aff"}15` }}
        >
          <Clock size={34} color={primaryColor || "#002aff"} />
        </View>
        <Text className="text-lg font-poppins-semibold text-foreground text-center mb-2">
          Próximamente
        </Text>
        <Text className="text-sm font-poppins text-muted-foreground text-center leading-5 max-w-[260px]">
          Aquí podrás revisar el registro de tus actividades y movimientos recientes.
        </Text>
      </View>
    </SafeAreaView>
  );
}
