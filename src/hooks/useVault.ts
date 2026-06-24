import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export interface VaultFile {
  name: string;
  uri: string;
  size: number;
  modificationTime: number;
}

export const useVault = () => {
  const VAULT_DIR = FileSystem.documentDirectory + "vault/";

  const initVault = async () => {
    const dirInfo = await FileSystem.getInfoAsync(VAULT_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true });
    }
  };

  const getVaultFiles = async (): Promise<VaultFile[]> => {
    await initVault();
    const files = await FileSystem.readDirectoryAsync(VAULT_DIR);
    
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const fileUri = VAULT_DIR + file;
        const info = await FileSystem.getInfoAsync(fileUri);
        return {
          name: file,
          uri: fileUri,
          size: info.exists ? info.size || 0 : 0,
          modificationTime: info.exists ? info.modificationTime || 0 : 0,
        };
      })
    );

    // Sort by modification time descending
    return fileStats.sort((a, b) => b.modificationTime - a.modificationTime);
  };

  const saveToVault = async (base64Data: string, fileName: string) => {
    await initVault();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileUri = VAULT_DIR + safeFileName;
    
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return fileUri;
  };

  const deleteFromVault = async (fileName: string) => {
    const fileUri = VAULT_DIR + fileName;
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri);
    }
  };

  const openVaultFile = async (fileUri: string) => {
    if (Platform.OS === "web") {
      // Not supported exactly like this on web, but vault is mostly mobile
      alert("La Bóveda Offline está optimizada para la app móvil.");
      return;
    }
    
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        dialogTitle: "Abrir documento de Bóveda",
        UTI: "com.adobe.pdf",
      });
    }
  };

  return {
    getVaultFiles,
    saveToVault,
    deleteFromVault,
    openVaultFile,
  };
};
