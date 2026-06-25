import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { useColorScheme as useRNColorScheme } from "react-native";

export function useAppTheme() {
  const { theme } = usePreferenceStore();
  const rnColorScheme = useRNColorScheme();

  // Si el tema es "system", se evalúa con el esquema nativo de la plataforma.
  // De lo contrario, se utiliza directamente el valor preferido de Zustand.
  const colorScheme = theme === "system" ? (rnColorScheme || "light") : theme;

  return {
    theme,
    colorScheme,
    isDark: colorScheme === "dark",
  };
}
