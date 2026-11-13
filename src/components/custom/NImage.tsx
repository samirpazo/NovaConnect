import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { View } from 'react-native';

interface NImageProps {
  /** Imagen ya descargada (data URI). */
  source?: string | null;
  className?: string;
  fallbackText?: string;
}

/**
 * Imagen de la persona. Muestra la foto cuando esta disponible y cae a la
 * inicial del nombre cuando no hay foto.
 *
 * La foto llega como data URI: NovaApi la sirve en `/GenPerson/MyPhoto` y el
 * endpoint de archivos por nombre (`GenUploadFiles`) ya no existe.
 */
export const NImage = ({ source, className, fallbackText }: NImageProps) => {
  if (source) {
    return (
      <Image
        source={{ uri: source }}
        className={className}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View className={cn("items-center justify-center bg-muted", className)}>
      <Text className="text-muted-foreground font-bold text-2xl">{fallbackText}</Text>
    </View>
  );
};
