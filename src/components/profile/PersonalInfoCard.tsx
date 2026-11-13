import { Text } from "@/components/ui/text";
import { Building2, IdCard, Mail, Phone } from "lucide-react-native";
import * as React from "react";
import { View } from "react-native";

interface PersonalInfoCardProps {
  documentNumber?: string;
  area?: string;
  email?: string;
  phone?: string;
  primaryColor: string;
}

interface Row {
  icon: typeof IdCard;
  label: string;
  value?: string;
}

/**
 * Datos de la persona en una tarjeta agrupada. Si un dato no esta informado,
 * la fila se oculta en lugar de mostrar un hueco.
 */
export function PersonalInfoCard({
  documentNumber,
  area,
  email,
  phone,
  primaryColor,
}: PersonalInfoCardProps) {
  const rows: Row[] = [
    { icon: IdCard, label: "Documento de identidad", value: documentNumber },
    { icon: Building2, label: "Área / Departamento", value: area },
    { icon: Phone, label: "Teléfono", value: phone },
    { icon: Mail, label: "Correo electrónico", value: email },
  ].filter((row) => !!row.value && row.value.trim().length > 0);

  if (rows.length === 0) return null;

  return (
    <View className="overflow-hidden rounded-[24px] border border-border/40 bg-card shadow-sm">
      <Text className="px-5 pb-1 pt-4 text-base font-poppins-bold text-foreground">
        Información Personal
      </Text>
      {rows.map((row, index) => (
        <View
          key={row.label}
          className={`flex-row items-start gap-3 px-5 py-3 ${
            index < rows.length - 1 ? "border-b border-border/30" : ""
          }`}
        >
          <row.icon
            size={16}
            color={primaryColor}
            style={{ marginTop: 2 }}
          />
          <View className="flex-1">
            <Text className="text-[11px] font-poppins-semibold uppercase tracking-wider text-muted-foreground">
              {row.label}
            </Text>
            <Text className="mt-0.5 text-base font-poppins-bold text-foreground">
              {row.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
