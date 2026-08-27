import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { fileService } from '@/services/fileService';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { api } from '@/lib/axios';

interface NImageProps {
  personId?: number | null;
  fileId?: number | null;
  className?: string;
  fallbackText?: string;
}

export const NImage = ({ personId, fileId, className, fallbackText }: NImageProps) => {
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
        let resolvedFileId = fileId;
        if (!resolvedFileId && personId) {
          const { data } = await api.get(`/GenPerson/GetPhotoHistory/${personId}`);
          const history = Array.isArray(data?.Data) ? data.Data : [];
          resolvedFileId = history.find((photo: { SecStatus?: boolean; FilID?: number }) =>
            photo.SecStatus && photo.FilID)?.FilID;
        }
        if (!resolvedFileId) throw new Error('La persona no tiene una foto activa.');
        const data = await fileService.getManagedImage(resolvedFileId);
        
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
      contentFit="cover"
      transition={200}
      onError={() => {
        setError(true);
      }}
    />
  );
};
