import { api } from "@/lib/axios";
import { storage } from "@/lib/storage";
import { AuthResponse } from "@/types/auth";
import { Platform } from "react-native";

export const authService = {
  async loginCollaborator(
    credentials: any,
  ): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
    try {
      const response = await api.post(
        "/Token/AuthenticationCollaborator",
        credentials,
      );
      const { data } = response;
      const isSuccess = data.Succeeded;
      const rawData = data.Data;
      const message = data.Message;

      if (isSuccess) {
        const cookies = response.headers["set-cookie"];
        const cookieText = Array.isArray(cookies)
          ? cookies.join(", ")
          : String(cookies || "");
        const accessToken =
          Platform.OS === "web"
            ? ""
            : cookieText.match(
                /(?:^|[,;]\s*)nova_connect_access_token=([^;,\s]+)/,
              )?.[1] || "";
        const refreshToken =
          Platform.OS === "web"
            ? ""
            : cookieText.match(
                /(?:^|[,;]\s*)nova_connect_refresh_token=([^;,\s]+)/,
              )?.[1] || "";
        if (Platform.OS !== "web" && (!accessToken || !refreshToken))
          throw new Error(
            "El servidor no entregó las credenciales de la sesión.",
          );
        const authData: AuthResponse = {
          Token: accessToken,
          RefreshToken: refreshToken,
          AccessTokenExpiration: rawData.AccessTokenExpiration,
          SsnID: rawData.SsnID,
          User: {
            UsrID: rawData.Collaborator?.ColID,
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
            PrsDocumentNumber: rawData.Collaborator?.PrsDocumentNumber,
            // GenPerson
            TypeDocument: rawData.Collaborator?.TypeDocument,
            TypeDocumentName: rawData.Collaborator?.TypeDocumentName,
            PrsBirthDay: rawData.Collaborator?.PrsBirthDay,
            TypeGender: rawData.Collaborator?.TypeGender,
            TypeGenderName: rawData.Collaborator?.TypeGenderName,
            PrsPhone: rawData.Collaborator?.PrsPhone,
            DptId: rawData.Collaborator?.DptId,
            DptName: rawData.Collaborator?.DptName,
            PrvId: rawData.Collaborator?.PrvId,
            PrvName: rawData.Collaborator?.PrvName,
            DtrId: rawData.Collaborator?.DtrId,
            DtrName: rawData.Collaborator?.DtrName,
            PaiId: rawData.Collaborator?.PaiId,
            PaiName: rawData.Collaborator?.PaiName,
            PrsAddress: rawData.Collaborator?.PrsAddress,
            PrsAddressDni: rawData.Collaborator?.PrsAddressDni,
            PrsVerifierCode: rawData.Collaborator?.PrsVerifierCode,
            TypeBloodGroup: rawData.Collaborator?.TypeBloodGroup,
            PrsEmergencyContact: rawData.Collaborator?.PrsEmergencyContact,
            PrsEmergencyPhone: rawData.Collaborator?.PrsEmergencyPhone,
            PrsMedicalConditions: rawData.Collaborator?.PrsMedicalConditions,
            PrsRuc: rawData.Collaborator?.PrsRuc,
            // MpwAgreement
            AgrID: rawData.Collaborator?.AgrID,
            AgrBeginDate: rawData.Collaborator?.AgrBeginDate,
            AgrEndDate: rawData.Collaborator?.AgrEndDate,
            AgrIsIndefinite: rawData.Collaborator?.AgrIsIndefinite,
            TypePayroll: rawData.Collaborator?.TypePayroll,
            TypePayrollName: rawData.Collaborator?.TypePayrollName,
            TypeSituation: rawData.Collaborator?.TypeSituation,
            TypeSituationName: rawData.Collaborator?.TypeSituationName,
            TypeWorker: rawData.Collaborator?.TypeWorker,
            TypeWorkerName: rawData.Collaborator?.TypeWorkerName,
            TypeContract: rawData.Collaborator?.TypeContract,
            TypeContractName: rawData.Collaborator?.TypeContractName,
            AreID: rawData.Collaborator?.AreID,
            AreName: rawData.Collaborator?.AreName,
            PstID: rawData.Collaborator?.PstID,
            PstName: rawData.Collaborator?.PstName,
            CceCode: rawData.Collaborator?.CceCode,
            CceName: rawData.Collaborator?.CceName,
            BslCode: rawData.Collaborator?.BslCode,
            BslName: rawData.Collaborator?.BslName,
          },
        };

        // Guardar Tokens de forma segura
        await storage.setItem("user", JSON.stringify(authData.User));
        if (Platform.OS !== "web") {
          await Promise.all([
            storage.setItem("token", authData.Token),
            storage.setItem("refreshToken", authData.RefreshToken),
          ]);
        } else {
          await Promise.all([
            storage.removeItem("token"),
            storage.removeItem("refreshToken"),
          ]);
        }

        return { success: true, data: authData };
      } else {
        return { success: false, error: message || "Credenciales inválidas." };
      }
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.response?.data?.Message ||
          "Error al conectar con el servidor.",
      };
    }
  },

  async validateRegistration(
    document: string,
  ): Promise<{ success: boolean; data?: number; error?: string }> {
    try {
      const { data } = await api.post("/SecCollaborator/Register", {
        DocumentNumber: document,
        Password: "dummy", // Requerido por el modelo, pero ignorado por el backend
      });

      if (data.Succeeded) {
        return { success: true, data: data.Data }; // Data contiene el PrsID
      }

      return {
        success: false,
        error: data.Message || "No se pudo completar la validación.",
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.response?.data?.Message ||
          "Error al intentar validar el registro.",
      };
    }
  },

  async validateLogin(document: string): Promise<{
    success: boolean;
    data?: { PrsID: number; HasAccount: boolean };
    error?: string;
  }> {
    try {
      const { data } = await api.post("/SecCollaborator/ValidateLogin", {
        DocumentNumber: document,
      });

      if (data.Succeeded) {
        return { success: true, data: data.Data };
      }

      return {
        success: false,
        error: data.Message || "No se pudo validar el acceso.",
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.response?.data?.Message || "Error al validar el documento.",
      };
    }
  },

  async requestEnrollmentOtp(
    document: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = await api.post("/SecCollaborator/RequestEnrollmentOtp", {
        DocumentNumber: document,
      });
      return { success: data.Succeeded, error: data.Message };
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.data?.Message || "No se pudo enviar el código.",
      };
    }
  },

  async registerCollaborator(
    document: string,
    otp: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = await api.post("/SecCollaborator/ConfirmEnrollment", {
        DocumentNumber: document,
        Otp: otp,
        NewPasswordHash: password,
      });
      return { success: data.Succeeded, error: data.Message };
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.response?.data?.Message || "No se pudo completar el registro.",
      };
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post("/Token/Logout");
    } catch {
      /* Local cleanup still runs if the session expired. */
    }
    await Promise.all([
      storage.removeItem("token"),
      storage.removeItem("refreshToken"),
      storage.removeItem("user"),
    ]);
  },

  async getSession(): Promise<AuthResponse["User"] | null> {
    const userStr = await storage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
};
