import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { api } from '@/lib/axios';

interface NImageProps {
  personId?: number | null;
  fileId?: number | null;
  className?: string;
  fallbackText?: string;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const NImage = ({ personId, fileId, className, fallbackText, contentFit = 'cover' }: NImageProps) => {
  const [base64, setBase64] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      if (!personId && !fileId) {
        setLoading(false);
        return;
      }
      try {
        const source = fileId
          ? `/GenFiles/${fileId}/preview`
          : "/GenPerson/MyPhoto";
        const response = await api.get(source, { responseType: "blob" });
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result ?? ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(response.data as Blob);
        });
        
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
  }, [personId, fileId]);

  if ((!personId && !fileId) || error || (!loading && !base64)) {
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
      contentFit={contentFit}
      transition={200}
      onError={() => {
        setError(true);
      }}
    />
  );
};
