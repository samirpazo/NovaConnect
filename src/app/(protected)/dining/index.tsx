import { Text } from "@/components/ui/text";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Utensils } from "lucide-react-native";
import { View } from "react-native";
export default function DiningScreen() {
  const { primaryColor } = usePreferenceStore();

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="w-20 h-20 rounded-2xl items-center justify-center mb-5"
          style={{ backgroundColor: `${primaryColor || "#002aff"}15` }}
        >
          <Utensils size={34} color={primaryColor || "#002aff"} />
        </View>
        <Text className="text-lg font-poppins-semibold text-foreground text-center mb-2">
          Próximamente
        </Text>
        <Text className="text-sm font-poppins text-muted-foreground text-center leading-5 max-w-[260px]">
          Consulta el menú del día, horarios y realiza tus reservas al comedor.
        </Text>
      </View>
    </View>
  );
}
