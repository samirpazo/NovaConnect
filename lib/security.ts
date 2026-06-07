import CryptoJS from "crypto-js";

// El Pepper es una clave secreta que se añade a la contraseña antes de hashear
const PASSWORD_SECRET =
  process.env.EXPO_PUBLIC_PASSWORD_SECRET ||
  process.env.NEXT_PUBLIC_PASSWORD_SECRET;

/**
 * Genera un hash SHA512 de la contraseña proporcionada.
 * Se utiliza un "Pepper" (clave secreta) para que el hash sea único del sistema.
 */
export const hashPassword = (password: string): string => {
  if (!password) return "";

  // Combinamos la contraseña con el secreto antes de hashear
  const hash = CryptoJS.SHA512(password + PASSWORD_SECRET);
  return hash.toString(CryptoJS.enc.Hex);
};
