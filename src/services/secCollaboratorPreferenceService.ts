import { api } from '@/lib/axios';

export type SecCollaboratorPreference = {
    PrfID?: number;
    ColID?: number;
    Theme?: string;
    PrimaryColor?: string;
};

export const secCollaboratorPreferenceService = {
    async getMyPreferences(): Promise<SecCollaboratorPreference | null> {
        const { data }: any = await api.get('/SecCollaboratorPreference/MyPreferences');
        return data.Data;
    },

    async savePreferences(preferences: SecCollaboratorPreference): Promise<SecCollaboratorPreference> {
        const { data }: any = await api.post('/SecCollaboratorPreference/Save', preferences);
        return data.Data;
    }
};
