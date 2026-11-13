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
    <View className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
      <Text className="px-4 pb-2 pt-4 text-[15px] font-poppins-bold text-foreground">
        Información Personal
      </Text>
      {rows.map((row) => (
        <View
          key={row.label}
          className="px-4 pb-4"
        >
          <View className="flex-row items-center gap-1.5 mb-1">
            <row.icon size={14} color={primaryColor} />
            <Text className="text-[11px] font-poppins-semibold uppercase tracking-wider text-muted-foreground">
              {row.label}
            </Text>
          </View>
          <Text className="text-sm font-poppins-semibold text-foreground">
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
