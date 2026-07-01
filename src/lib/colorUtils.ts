/**
 * Convierte un color HEX (ej. #002aff) a formato HSL usado por NativeWind v4 (ej. "230 100% 50%")
 */
const DEFAULT_PRIMARY_COLOR = "#002aff";

export function sanitizePrimaryColor(color: string | undefined | null, fallback = DEFAULT_PRIMARY_COLOR): string {
  if (!color) return fallback;
  const normalized = color.toLowerCase();
  if (normalized === "#ff0000" || normalized === "ff0000") return fallback;
  return color;
}

export const hexToNativeWindHsl = (hex: string): string => {
  if (!hex) return '';
  
  // Quitar el # si existe
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  const hue = Math.round(h * 360);
  const saturation = Math.round(s * 100);
  const lightness = Math.round(l * 100);

  return `${hue} ${saturation}% ${lightness}%`;
};
