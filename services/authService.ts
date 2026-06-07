import { api } from '@/lib/axios';
import { storage } from '@/lib/storage';

export interface AuthResponse {
  Token: string;
  RefreshToken: string;
  AccessTokenExpiration: string;
  SsnID: number;
  User: {
    UsrID: number;
    UsrName: string;
    UsrEmail: string;
    PrsPhoto: string | null;
    UsrChangePassword: boolean;
    CreateDate: Date | string;
    PrsID: number;
    FullName: string;
    PrsName: string;
    PaternalLastName: string;
    MaternalLastName: string;
    ColID: number;
  };
}

export const authService = {
  async loginCollaborator(credentials: any): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
    try {
      const { data } = await api.post('/Token/AuthenticationCollaborator', credentials);
      const isSuccess = data.Succeeded;
      const rawData = data.Data;
      const message = data.Message;
      
      if (isSuccess) {
        const authData: AuthResponse = {
          Token: rawData.Token,
          RefreshToken: rawData.RefreshToken,
          AccessTokenExpiration: rawData.AccessTokenExpiration,
          SsnID: rawData.SsnID,
          User: {
            UsrID: rawData.Collaborator?.PrsID, 
            UsrName: rawData.Collaborator?.PrsDocumentNumber,
            ColID: rawData.Collaborator?.ColID,
            UsrEmail: rawData.Collaborator?.PrsEmail,
            PrsPhoto: rawData.Collaborator?.PrsPhoto,
            UsrChangePassword: false, 
            CreateDate: new Date(),
            PrsID: rawData.Collaborator?.PrsID,
            FullName: rawData.Collaborator?.FullName,
            PrsName: rawData.Collaborator?.PrsName,
            PaternalLastName: rawData.Collaborator?.PaternalLastName,
            MaternalLastName: rawData.Collaborator?.MaternalLastName,
          }
        };

        // Guardar Tokens de forma segura
        await Promise.all([
          storage.setItem('token', authData.Token),
          storage.setItem('refreshToken', authData.RefreshToken),
          storage.setItem('user', JSON.stringify(authData.User))
        ]);

        return { success: true, data: authData };
      } else {
        return { success: false, error: message || 'Credenciales inválidas.' };
      }
    } catch (error: any) {
      return { success: false, error: error?.response?.data?.Message || 'Error al conectar con el servidor.' };
    }
  },

  async registerCollaborator(credentials: any): Promise<{ success: boolean; data?: boolean; error?: string }> {
    try {
      const { data } = await api.post('/SecCollaborator/Register', credentials);
      
      if (data.Succeeded) {
        return { success: true, data: data.Data };
      }
      
      return { success: false, error: data.Message || 'No se pudo completar el registro.' };
    } catch (error: any) {
      return { success: false, error: error?.response?.data?.Message || 'Error al intentar registrar el colaborador.' };
    }
  },

  async logout(): Promise<void> {
    await Promise.all([
      storage.removeItem('token'),
      storage.removeItem('refreshToken'),
      storage.removeItem('user')
    ]);
  },

  async getSession(): Promise<AuthResponse['User'] | null> {
    const userStr = await storage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
};
