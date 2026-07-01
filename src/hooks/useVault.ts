import { logger } from "@/lib/logger";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { AlertHelper } from "@/lib/alert";

export interface VaultFileMetadata {
  displayName?: string;
  periodMonth?: string;
  periodYear?: string;
}

export interface VaultFile {
  name: string;
  uri: string;
  size: number;
  modificationTime: number;
  displayName?: string;
  periodMonth?: string;
  periodYear?: string;
}

export const useVault = () => {
  const VAULT_DIR = FileSystem.documentDirectory + "vault/";
  const METADATA_FILE = VAULT_DIR + "metadata.json";

  const initVault = async () => {
    const dirInfo = await FileSystem.getInfoAsync(VAULT_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true });
    }
  };

  const readMetadata = async (): Promise<Record<string, VaultFileMetadata>> => {
    try {
      const info = await FileSystem.getInfoAsync(METADATA_FILE);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(METADATA_FILE);
        return JSON.parse(content);
      }
    } catch (e) {
      logger.error("Error reading vault metadata:", e);
    }
    return {};
  };

  const writeMetadata = async (metadata: Record<string, VaultFileMetadata>) => {
    try {
      await FileSystem.writeAsStringAsync(METADATA_FILE, JSON.stringify(metadata));
    } catch (e) {
      logger.error("Error writing vault metadata:", e);
    }
  };

  const getVaultFiles = async (): Promise<VaultFile[]> => {
    await initVault();
    const files = await FileSystem.readDirectoryAsync(VAULT_DIR);
    const vaultFiles = files.filter((f) => f !== "metadata.json");
    
    const metadata = await readMetadata();

    const fileStats = await Promise.all(
      vaultFiles.map(async (file) => {
        const fileUri = VAULT_DIR + file;
        const info = await FileSystem.getInfoAsync(fileUri);
        const fileMeta = metadata[file] || {};
        
        return {
          name: file,
          uri: fileUri,
          size: info.exists ? info.size || 0 : 0,
          modificationTime: info.exists ? info.modificationTime || 0 : 0,
          displayName: fileMeta.displayName,
          periodMonth: fileMeta.periodMonth,
          periodYear: fileMeta.periodYear,
        };
      })
    );

    // Sort by modification time descending
    return fileStats.sort((a, b) => b.modificationTime - a.modificationTime);
  };

  const saveToVault = async (base64Data: string, fileName: string, metadataParams?: VaultFileMetadata) => {
    await initVault();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileUri = VAULT_DIR + safeFileName;
    
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    if (metadataParams) {
      const metadata = await readMetadata();
      metadata[safeFileName] = metadataParams;
      await writeMetadata(metadata);
    }
    
    return fileUri;
  };

  const deleteFromVault = async (fileName: string) => {
    const fileUri = VAULT_DIR + fileName;
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri);
      
      // Eliminar metadata
      const metadata = await readMetadata();
      if (metadata[fileName]) {
        delete metadata[fileName];
        await writeMetadata(metadata);
      }
    }
  };

  const openVaultFile = async (fileUri: string) => {
    if (Platform.OS === "web") {
      AlertHelper.alert(
        "Bóveda Offline",
        "La Bóveda Offline está optimizada para la app móvil."
      );
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
