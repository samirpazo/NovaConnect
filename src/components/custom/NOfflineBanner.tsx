import { Text } from '@/components/ui/text';
import { useNetwork } from '@/hooks/useNetwork';
import { WifiOff } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Aviso de que no hay conexion. Sin el, un fallo de red se presenta como un
 * listado vacio y el colaborador puede creer que no tiene nada que hacer.
 */
export const NOfflineBanner = () => {
  const isOnline = useNetwork();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View
      className="flex-row items-center gap-2 bg-amber-500 px-4 py-2"
      style={{ paddingTop: insets.top + 8 }}
      accessibilityRole="alert"
    >
      <WifiOff size={14} color="#ffffff" />
      <Text className="flex-1 text-xs font-bold text-white">
        Sin conexion. Se muestran los datos guardados en el dispositivo.
      </Text>
    </View>
  );
};
