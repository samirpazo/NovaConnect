import { api } from "@/lib/axios";

export type SecCollaboratorPreference = {
  PrfID?: number;
  ColID?: number;
  Theme?: string;
  PrimaryColor?: string;
};

export const secCollaboratorPreferenceService = {
  async getMyPreferences(): Promise<SecCollaboratorPreference | null> {
    const { data }: any = await api.get(
      "/SecCollaboratorPreference/MyPreferences",
    );
    return data.Data;
  },

  async savePreferences(
    preferences: SecCollaboratorPreference,
  ): Promise<SecCollaboratorPreference> {
    const { data }: any = await api.post(
      "/SecCollaboratorPreference/Save",
      preferences,
    );
    if (data?.Succeeded === false)
      throw new Error("No se pudieron guardar las preferencias.");
    return data.Data;
  },
};

let pendingSave: {
  preferences: SecCollaboratorPreference;
  onSettled: (saved: boolean) => void;
} | null = null;
let saveTimer: ReturnType<typeof setTimeout>;
let saving = false;

async function flushPreferences() {
  if (saving) return;
  saving = true;
  while (pendingSave) {
    const next = pendingSave;
    pendingSave = null;
    try {
      await secCollaboratorPreferenceService.savePreferences(next.preferences);
      next.onSettled(true);
    } catch {
      next.onSettled(false);
    }
  }
  saving = false;
}

// Conserva el último cambio y termina el envío aunque se cierre la pantalla.
export function queuePreferenceSave(
  preferences: SecCollaboratorPreference,
  onSettled: (saved: boolean) => void,
) {
  pendingSave = { preferences, onSettled };
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flushPreferences(), 600);
}
