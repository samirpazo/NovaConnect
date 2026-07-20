import { logger } from "@/lib/logger";
import { storage } from "@/lib/storage";
import axios from "axios";
import { Platform } from "react-native";

// Use local network IP for testing on physical device/emulator, or localhost for iOS simulator
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://localhost:8080");

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Variables para control de concurrencia en el refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

let isLoggingOut = false;
let globalLogoutCallback: (() => void) | null = null;

export const setGlobalLogoutCallback = (callback: () => void) => {
  globalLogoutCallback = callback;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor: agrega Token JWT y API Key móvil
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. JWT Bearer token (para endpoints protegidos post-login)
      const token = await storage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 2. API Key móvil (para endpoints pre-login como ValidateLogin, Register)
      // El backend acepta ambos: con JWT no verifica la key, sin JWT la verifica
      const mobileApiKey = process.env.EXPO_PUBLIC_MOBILE_API_KEY;
      if (mobileApiKey) {
        config.headers["X-Mobile-Api-Key"] = mobileApiKey;
      }
    } catch (error) {
      logger.error("Error getting token from SecureStore", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    // Solo errores 401 disparan el flujo de refresh
    if (status !== 401) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (!originalRequest._retry && !isLoggingOut) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/Token/Refresh`, { RefreshToken: refreshToken });
          
          if (response.data.Succeeded && response.data.Data) {
            const newToken = response.data.Data.Token;
            const newRefreshToken = response.data.Data.RefreshToken;

            await storage.setItem("token", newToken);
            await storage.setItem("refreshToken", newRefreshToken);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            processQueue(null, newToken);
            return api(originalRequest);
          } else {
             throw new Error("Invalid refresh response");
          }
        } else {
          throw new Error("No refresh token");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        logger.warn("Token refresh failed, logging out", refreshError);
        isLoggingOut = true;
        if (globalLogoutCallback) {
          globalLogoutCallback();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        isLoggingOut = false;
      }
    }

    return Promise.reject(error);
  },
);

// Helper to create AbortController tied to AbortSignal
// Usage in components:
//   const { signal, cancel } = createAbortController();
//   await api.get('/endpoint', { signal });
//   cancel(); // on unmount
export function createAbortController() {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
}
