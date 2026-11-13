import { NImage } from "@/components/custom/NImage";
import * as React from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";

interface FullScreenPhotoModalProps {
  visible: boolean;
  photo?: string | null;
  name?: string;
  onClose: () => void;
}

/**
 * Foto a pantalla completa. El avatar se oculta mientras el modal esta abierto
 * para que la vista ampliada no se solape con su version en miniature.
 */
export function FullScreenPhotoModal({
  visible,
  photo,
  name,
  onClose,
}: FullScreenPhotoModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/90 p-8">
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar la foto"
        />
        <Animated.View
          entering={ZoomIn.duration(320).springify()}
          exiting={FadeOut.duration(180)}
          className="overflow-hidden border-4 shadow-2xl"
          style={{ width: 300, height: 300, borderRadius: 150 }}
        >
          <NImage
            source={photo}
            className="h-full w-full"
            fallbackText={name?.[0]?.toUpperCase() || "U"}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}
