import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { fileService } from '@/services/fileService';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

interface NImageProps {
  genParameter: string;
  fileName?: string | null;
  /** Imagen ya descargada (data URI). Tiene prioridad sobre `fileName`. */
  source?: string | null;
  className?: string;
  fallbackText?: string;
}

export const NImage = ({
  genParameter,
  fileName,
  source,
  className,
  fallbackText,
}: NImageProps) => {
  const [base64, setBase64] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // La imagen ya descargada se usa tal cual: no hace falta pedirla otra vez.
    if (source) {
      setBase64(source);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchImage = async () => {
      if (!fileName) {
        setLoading(false);
        return;
      }
      try {
        const lastDotIndex = fileName.lastIndexOf('.');
        const nameFile = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;

        const data = await fileService.getFile(genParameter, nameFile, true);
        if (!cancelled) setBase64(data);
      } catch (err) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchImage();
    return () => {
      cancelled = true;
    };
  }, [fileName, genParameter, source]);

  if (!source && (!fileName || error || (!loading && !base64))) {
    return (
      <View className={cn("items-center justify-center bg-muted", className)}>
        <Text className="text-muted-foreground font-bold text-2xl">{fallbackText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: base64 || undefined }}
      className={className}
      contentFit="cover"
      transition={200}
    />
  );
};
