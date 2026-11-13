import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CloudOff } from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, Modal, View } from "react-native";

interface ConfirmReceptionModalProps {
  visible: boolean;
  documentLabel?: string;
  periodLabel?: string;
  offline: boolean;
  confirming: boolean;
  primaryColor: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmacion de recepcion de un documento. La accion es irreversible desde
 * el movil, asi que el boton queda deshabilitado sin conexion y se avisa del
 * motivo.
 */
export function ConfirmReceptionModal({
  visible,
  documentLabel,
  periodLabel,
  offline,
  confirming,
  primaryColor,
  onCancel,
  onConfirm,
}: ConfirmReceptionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center bg-black/60 px-6">
        <View className="gap-4 rounded-[24px] border border-border/40 bg-background p-5">
          <View className="items-center gap-2">
            <Text className="text-center text-xl font-poppins-bold tracking-tight text-foreground">
              Confirmar recepción
            </Text>
            <Text className="text-center text-sm font-poppins-medium text-muted-foreground">
              ¿Deseas recepcionar el documento
              {documentLabel ? ` ${documentLabel}` : ""}
              {periodLabel ? ` de ${periodLabel}` : ""}?
            </Text>
          </View>

          {documentLabel || periodLabel ? (
            <View
              className="flex-row items-center gap-2.5 rounded-xl border px-3 py-2.5"
              style={{
                backgroundColor: `${primaryColor}12`,
                borderColor: `${primaryColor}30`,
              }}
            >
              <CheckCircle2 size={18} color={primaryColor} />
              <View className="flex-1">
                {documentLabel ? (
                  <Text
                    className="text-xs font-poppins-bold uppercase tracking-wider"
                    style={{ color: primaryColor }}
                  >
                    {documentLabel}
                  </Text>
                ) : null}
                {periodLabel ? (
                  <Text
                    className="text-xs font-poppins-semibold"
                    style={{ color: primaryColor }}
                  >
                    {periodLabel}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {offline ? (
            <View className="flex-row items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-2.5">
              <CloudOff size={16} color="#D97706" />
              <Text className="flex-1 text-xs font-poppins-medium text-amber-700">
                Requiere conexión a internet para registrar tu conformidad.
              </Text>
            </View>
          ) : null}

          <View className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={confirming}
              onPress={onCancel}
            >
              <Text>Cancelar</Text>
            </Button>
            <Button
              className="flex-1"
              disabled={confirming || offline}
              onPress={onConfirm}
              style={{ backgroundColor: offline ? undefined : primaryColor }}
            >
              {confirming ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <CheckCircle2 size={16} color="#ffffff" />
              )}
              <Text className="text-white">
                {confirming ? "Confirmando..." : "Sí, Confirmar"}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
