import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { fileService } from '@/services/fileService';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

interface NImageProps {
  genParameter: string;
  fileName?: string | null;
  className?: string;
  fallbackText?: string;
}

export const NImage = ({ genParameter, fileName, className, fallbackText }: NImageProps) => {
  const [base64, setBase64] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      if (!fileName) {
        setLoading(false);
        return;
      }
      try {
        const lastDotIndex = fileName.lastIndexOf('.');
        const nameFile = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
        
        const data = await fileService.getFile(genParameter, nameFile, true);
        
        // React Native / Expo Image es estricto y falla si el base64 contiene saltos de línea (a diferencia de la Web)
        const cleanBase64 = data ? data.replace(/[\n\r\s]/g, '') : null;
        setBase64(cleanBase64);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [fileName, genParameter]);

  if (!fileName || error || (!loading && !base64)) {
    return (
      <View className={cn("items-center justify-center bg-muted", className)}>
        <Text className="text-muted-foreground font-bold text-2xl">{fallbackText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: base64 || undefined }}
      style={{ width: '100%', height: '100%' }}
      className={className}
      contentFit="cover"
      transition={200}
      onError={() => {
        setError(true);
      }}
    />
  );
};
