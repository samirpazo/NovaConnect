import * as LocalAuthentication from "expo-local-authentication";

import { storage } from "@/lib/storage";

const ENABLED_KEY = "isBiometricEnabled";
const PIN_KEY = "savedHashedPin";
const DOCUMENT_KEY = "savedDocumentNumber";

/**
 * Acceso biometrico al collaborator.
 *
 * El PIN ya viene hasheado desde el cliente (SHA-512 con pepper) porque es
 * justo el valor que el backend espera. Se guarda en SecureStore y solo se
 * reutiliza para el documento con el que se activo: el PIN de una persona no
 * debe servir para entrar como otra.
 */
export const biometricService = {
  async isSupported(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  },

  async isEnabled(): Promise<boolean> {
    return (await storage.getItem(ENABLED_KEY)) === "true";
  },

  async getSavedDocument(): Promise<string | null> {
    return storage.getItem(DOCUMENT_KEY);
  },

  /** Recuerda el documento para prellenar el formulario de acceso. */
  async rememberDocument(documentNumber: string): Promise<void> {
    await storage.setItem(DOCUMENT_KEY, documentNumber);
  },

  async enable(documentNumber: string, hashedPin: string): Promise<void> {
    await storage.setItem(PIN_KEY, hashedPin);
    await storage.setItem(DOCUMENT_KEY, documentNumber);
    await storage.setItem(ENABLED_KEY, "true");
  },

  async disable(): Promise<void> {
    await storage.removeItem(PIN_KEY);
    await storage.removeItem(DOCUMENT_KEY);
    await storage.removeItem(ENABLED_KEY);
  },

  /** Credenciales guardadas, si las hay. */
  async getCredentials(): Promise<{
    documentNumber: string | null;
    hashedPin: string | null;
  }> {
    const [documentNumber, hashedPin] = await Promise.all([
      storage.getItem(DOCUMENT_KEY),
      storage.getItem(PIN_KEY),
    ]);
    return { documentNumber, hashedPin };
  },
};
