import { NImage } from "@/components/custom/NImage";
import { Text } from "@/components/ui/text";
import * as Haptics from "expo-haptics";
import { Camera } from "lucide-react-native";
import * as React from "react";
import { Platform, Pressable, View } from "react-native";

interface ProfileHeaderProps {
  photo?: string | null;
  fullName?: string;
  position?: string;
  primaryColor: string;
  onPressAvatar?: () => void;
  avatarHidden?: boolean;
}

/** Iniciales a partir del nombre completo: "Nombre Apellido" -> "NA". */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return "US";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Encabezado de perfil: avatar con borde de marca, insignia de camara y el
 * nombre en mayusculas. El cargo va en una pastilla con el color de marca.
 */
export function ProfileHeader({
  photo,
  fullName,
  position,
  primaryColor,
  onPressAvatar,
  avatarHidden,
}: ProfileHeaderProps) {
  const displayName = fullName?.trim() || "Colaborador";
  const initials = getInitials(displayName);
  const hasPhoto = !!photo;

  return (
    <View className="w-full items-center gap-4">
      <Pressable
        onPress={() => {
          if (!hasPhoto || !onPressAvatar) return;
          if (Platform.OS !== "web")
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
              () => undefined
            );
          onPressAvatar();
        }}
        disabled={!hasPhoto}
        accessibilityRole="button"
        accessibilityLabel="Ver foto de perfil"
        accessibilityState={{ disabled: !hasPhoto }}
        className={`items-center justify-center rounded-full border-2 active:opacity-80 ${
          avatarHidden ? "opacity-0" : ""
        }`}
        style={{
          width: 104,
          height: 104,
          borderColor: primaryColor,
          backgroundColor: `${primaryColor}15`,
        }}
      >
        <NImage
          source={photo}
          className="h-full w-full rounded-full"
          fallbackText={initials}
        />
        {hasPhoto ? (
          <View
            className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-card"
            style={{ backgroundColor: primaryColor }}
          >
            <Camera size={14} color="#ffffff" />
          </View>
        ) : null}
      </Pressable>

      <View className="w-full items-center gap-2.5">
        <Text
          className="text-center text-lg font-poppins-bold uppercase leading-tight tracking-tight text-foreground"
          numberOfLines={2}
          accessibilityLabel={displayName}
        >
          {displayName}
        </Text>
        {position ? (
          <View
            className="self-center rounded-xl border px-3 py-1"
            style={{
              backgroundColor: `${primaryColor}1f`,
              borderColor: `${primaryColor}59`,
            }}
          >
            <Text
              className="text-xs font-poppins-bold uppercase tracking-wider"
              style={{ color: primaryColor }}
              numberOfLines={1}
            >
              {position}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
