import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { hashPassword } from "@/lib/security";
import { showToast } from "@/lib/toast";
import { biometricService } from "@/services/biometricService";
import { Fingerprint, ShieldCheck } from "lucide-react-native";
import * as React from "react";
import { Modal, Pressable, View } from "react-native";

interface BiometricRowProps {
  enabled: boolean;
  supported: boolean;
  primaryColor: string;
  onEnable: () => void;
  onDisable: () => void;
}

/**
 * Acceso biometrico. Activarlo exige confirmar el PIN: no se puede dejar la
 * biometria habilitada sin que el titular demuestre que conoce su clave.
 */
export function BiometricRow({
  enabled,
  supported,
  primaryColor,
  onEnable,
  onDisable,
}: BiometricRowProps) {
  const [pinVisible, setPinVisible] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [documentNumber, setDocumentNumber] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!pinVisible) return;
    void biometricService
      .getCredentials()
      .then(({ documentNumber: saved }) => setDocumentNumber(saved ?? ""))
      .catch(() => setDocumentNumber(""));
  }, [pinVisible]);

  const confirm = async () => {
    if (pin.length < 4) {
      showToast.error("Error", "Ingresa tu PIN para continuar.");
      return;
    }
    if (!documentNumber) {
      showToast.error(
        "Error",
        "No hay un documento guardado en este dispositivo. Inicia sesion una vez para activarlo."
      );
      return;
    }
    setBusy(true);
    try {
      const { documentNumber: saved } = await biometricService.getCredentials();
      if (!saved) {
        showToast.error("Error", "No se encontro el documento guardado.");
        return;
      }
      // El hash se guarda tal cual lo espera el backend: es el mismo valor
      // que se envia al iniciar sesion con PIN.
      await biometricService.enable(saved, hashPassword(pin));
      setPin("");
      setPinVisible(false);
      showToast.success(
        "Acceso biometrico activado",
        "Ya puedes entrar con tu huella sin escribir el PIN."
      );
      onEnable();
    } catch {
      showToast.error("Error", "No se pudo activar el acceso biometrico.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <View className="overflow-hidden rounded-[24px] border border-border/40 bg-card shadow-sm">
        <View className="flex-row items-center gap-4 px-5 py-4">
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Fingerprint size={20} color={primaryColor} />
          </View>
          <View className="flex-1">
            <Text className="mb-0.5 text-[11px] font-poppins-semibold uppercase tracking-widest text-muted-foreground">
              Acceso biometrico
            </Text>
            <Text className="text-sm font-poppins-medium text-foreground">
              {enabled
                ? "Activado en este dispositivo"
                : supported
                  ? "Entra con tu huella sin escribir el PIN"
                  : "Este dispositivo no admite biometria"}
            </Text>
          </View>
          {enabled ? (
            <Pressable
              onPress={onDisable}
              accessibilityRole="switch"
              accessibilityState={{ checked: enabled }}
              accessibilityLabel="Desactivar el acceso biometrico"
              className="rounded-full px-3 py-1.5 active:opacity-70"
              style={{ backgroundColor: `${primaryColor}18` }}
            >
              <Text
                className="text-xs font-poppins-bold"
                style={{ color: primaryColor }}
              >
                Desactivar
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onEnable}
              disabled={!supported}
              accessibilityRole="switch"
              accessibilityState={{ checked: false }}
              accessibilityLabel="Activar el acceso biometrico"
              className="rounded-full px-3 py-1.5 active:opacity-70 disabled:opacity-40"
              style={{ backgroundColor: `${primaryColor}18` }}
            >
              <Text
                className="text-xs font-poppins-bold"
                style={{ color: primaryColor }}
              >
                Activar
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Modal
        visible={pinVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinVisible(false)}
      >
        <View className="flex-1 justify-center bg-black/60 px-6">
          <View className="gap-4 rounded-[24px] border border-border/40 bg-background p-5">
            <View className="items-center gap-2">
              <ShieldCheck size={22} color={primaryColor} />
              <Text className="text-center text-lg font-poppins-bold text-foreground">
                Confirma tu PIN
              </Text>
              <Text className="text-center text-xs font-poppins-medium text-muted-foreground">
                Lo usaremos para activar el acceso biometrico en este
                dispositivo.
              </Text>
            </View>
            <View className="flex-row items-center gap-2 rounded-xl border border-border/40 bg-secondary/40 px-3">
              <Text className="flex-1 py-3 font-poppins-mono text-base text-foreground">
                {pin ? "•".repeat(pin.length) : " "}
              </Text>
            </View>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setPin((p) => (p.length < 6 ? p + n : p))}
                  accessibilityRole="button"
                  className="flex-1 items-center justify-center rounded-lg bg-secondary/70 py-2 active:opacity-70"
                >
                  <Text className="text-sm font-poppins-bold text-foreground">
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => {
                  setPin("");
                  setPinVisible(false);
                }}
              >
                <Text>Cancelar</Text>
              </Button>
              <Button
                className="flex-1"
                disabled={busy}
                onPress={() => void confirm()}
              >
                <Text>{busy ? "Verificando..." : "Confirmar"}</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
