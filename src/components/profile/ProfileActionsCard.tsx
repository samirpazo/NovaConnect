import { Text } from "@/components/ui/text";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import * as React from "react";
import { Pressable, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface ProfileActionsCardProps {
  /** Contenido del codigo QR. Si falta, la seccion no se muestra. */
  qrValue?: string;
  primaryColor: string;
  actions: {
    key: string;
    label: string;
    description?: string;
    icon: React.ComponentType<{
      size?: number;
      color?: string;
      className?: string;
    }>;
    onPress: () => void;
  }[];
}

/**
 * Acciones del perfil agrupadas en una tarjeta. El codigo QR va plegable:
 *Ocupa espacio solo cuando hace falta.
 */
export function ProfileActionsCard({
  qrValue,
  primaryColor,
  actions,
}: ProfileActionsCardProps) {
  const [qrOpen, setQrOpen] = React.useState(false);

  return (
    <View className="overflow-hidden rounded-[24px] border border-border/40 bg-card shadow-sm">
      {qrValue ? (
        <>
          <Pressable
            onPress={() => setQrOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: qrOpen }}
            accessibilityLabel="Mostrar u ocultar el codigo QR"
            className="flex-row items-center gap-3.5 px-4 py-3.5 active:bg-secondary/40"
          >
            <View
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${primaryColor}1f` }}
            >
              <QrIcon color={primaryColor} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-poppins-bold text-foreground">
                Código QR
              </Text>
              <Text className="text-xs font-poppins-medium text-muted-foreground">
                {qrOpen ? "Toca para ocultar" : "Toca para ver tu código"}
              </Text>
            </View>
            <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary/60">
              {qrOpen ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </View>
          </Pressable>

          {qrOpen ? (
            <View className="items-center gap-3 px-4 pb-5">
              <View className="self-center rounded-2xl bg-white p-4">
                <QRCode
                  value={qrValue}
                  size={190}
                  color="#000000"
                  backgroundColor="#ffffff"
                />
              </View>
              <Text className="px-4 text-center text-xs font-poppins-medium text-muted-foreground">
                Muestra este código en los puntos de control para validar tu
                identidad.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {actions.map((action, index) => (
        <Pressable
          key={action.key}
          onPress={action.onPress}
          accessibilityRole="button"
          className={`flex-row items-center gap-3.5 px-4 py-3.5 active:bg-secondary/40 ${
            index === 0 && qrValue
              ? "border-t border-border/30"
              : actions[index - 1] || !qrValue
                ? ""
                : "border-t border-border/30"
          }`}
        >
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${primaryColor}1f` }}
          >
            <action.icon size={20} color={primaryColor} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-poppins-bold text-foreground">
              {action.label}
            </Text>
            {action.description ? (
              <Text className="text-xs font-poppins-medium text-muted-foreground">
                {action.description}
              </Text>
            ) : null}
          </View>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary/60">
            <ChevronUp
              size={16}
              className="rotate-[-90deg] text-muted-foreground"
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/** Icono de QR dibujado con cuadrados, igual que la referencia visual. */
function QrIcon({ color }: { color: string }) {
  const block = (left: number, top: number, size = 6) => (
    <View
      key={`${left}-${top}`}
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        borderWidth: 1.5,
        borderColor: color,
        borderRadius: 1.5,
      }}
    />
  );
  return (
    <View style={{ width: 20, height: 20 }}>
      {block(0, 0)}
      {block(0, 14)}
      {block(14, 0)}
      {block(7, 7, 5)}
      {block(13, 8, 5)}
    </View>
  );
}
