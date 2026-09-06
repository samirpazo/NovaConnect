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
  // Web (site3): necesario para que el navegador envíe/almacene las cookies
  // (auth HttpOnly + CSRF). En native React Native no persiste cookies, por lo
  // que este flag es un no-op; allí el Bearer se construye desde Set-Cookie.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Nova-Client": "nova-connect",
  },
});

// ---------------------------------------------------------------------------
// CSRF (Double Submit Cookie)
//
// GET /Token/CsrfToken devuelve un token aleatorio y lo guarda en la cookie
// 'nova-csrf-token'. En cada POST/PUT/DELETE/PATCH (fuera de /token) el backend
// exige que el header X-CSRF-TOKEN coincida con esa cookie.
//   - Web (site3): el navegador administra la cookie automáticamente (withCredentials).
//   - Native: React Native bloquea el header 'Cookie' y la auth es por Bearer (sin
//     cookies) → no es vulnerable a CSRF. La app envía 'X-Client-Platform: native'
//     y el backend exime estos requests de la validación.
// ---------------------------------------------------------------------------
let _csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  _csrfToken = token;
}

export function getCsrfToken(): string | null {
  return _csrfToken;
}

export async function initCsrf(): Promise<void> {
  try {
    const response = await axios.get<{ Succeeded: boolean; Data?: string }>(
      `${API_URL}/Token/CsrfToken`,
      {
        withCredentials: true,
        headers: { "X-Nova-Client": "nova-connect" },
      },
    );
    if (response.data?.Succeeded && response.data?.Data) {
      _csrfToken = response.data.Data;
    }
  } catch (error) {
    logger.warn("initCsrf failed", error);
  }
}

const MUTATING_METHODS = ["post", "put", "patch", "delete"];

/** Evita enviar Bearer/Cookie con valores inválidos tipo "undefined" (legacy de localStorage). */
export function isValidToken(value: string | null | undefined): value is string {
  return !!value && value !== "undefined" && value !== "null";
}

function getSetCookie(headers: any): any {
  if (!headers) return null;
  return headers["set-cookie"] ?? headers["Set-Cookie"] ?? null;
}

function parseCookieValue(cookies: any, name: string): string | null {
  if (!cookies) return null;
  const raw = Array.isArray(cookies) ? cookies.join(";") : String(cookies);
  const match = raw.match(new RegExp(`${name}=([^;]+)`, "i"));
  return match ? match[1] : null;
}

/**
 * En native el header Set-Cookie es legible por JS (el backend entrega los tokens
 * en cookies HttpOnly). En web el navegador lo filtra y la auth es por cookies.
 */
export async function fetchTokensFromResponse(response: any): Promise<{
  token: string | null;
  refreshToken: string | null;
}> {
  const cookies = getSetCookie(response?.headers);
  return {
    token:
      parseCookieValue(cookies, "nova_connect_access_token") ??
      parseCookieValue(cookies, "nova_access_token"),
    refreshToken:
      parseCookieValue(cookies, "nova_connect_refresh_token") ??
      parseCookieValue(cookies, "nova_refresh_token"),
  };
}

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

/** Aplica Bearer solo si hay token válido; si no, lo elimina (web se autentica por cookies). */
const applyBearer = (config: any, token: string | null | undefined) => {
  if (!config.headers) return;
  if (isValidToken(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
};

// Request interceptor: agrega JWT Bearer, API Key móvil y token CSRF a mutaciones
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. JWT Bearer token (para endpoints protegidos post-login)
      const token = await storage.getItem("token");
      if (isValidToken(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 2. API Key móvil (para endpoints pre-login como ValidateLogin, Register)
      // El backend acepta ambos: con JWT no verifica la key, sin JWT la verifica
      const mobileApiKey = process.env.EXPO_PUBLIC_MOBILE_API_KEY;
      if (mobileApiKey) {
        config.headers["X-Mobile-Api-Key"] = mobileApiKey;
      }

      // 3. CSRF en mutaciones (Double Submit Cookie: header debe coincidir con la cookie).
      //    - Web: el navegador envía la cookie automáticamente (withCredentials).
      //    - Native: React Native bloquea el header 'Cookie', por lo que el backend exime
      //      los requests con 'X-Client-Platform: native' (auth por Bearer, sin cookies).
      if (Platform.OS !== "web") {
        config.headers["X-Client-Platform"] = "native";
      }
      if (config.method && MUTATING_METHODS.includes(config.method) && _csrfToken) {
        config.headers["X-CSRF-TOKEN"] = _csrfToken;
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
    const originalRequest = error.config;

    // Auto-recuperación CSRF: si una mutación fue rechazada por token inválido/faltante
    // re-inicializamos el token y reintentamos UNA vez.
    const errData = error.response?.data;
    const errMessage =
      typeof errData === "object" && errData !== null && typeof errData.Message === "string"
        ? errData.Message
        : "";
    if (
      status === 400 &&
      errMessage.includes("CSRF") &&
      !originalRequest._csrfRetry &&
      !originalRequest.url?.toLowerCase().includes("/token")
    ) {
      originalRequest._csrfRetry = true;
      try {
        await initCsrf();
        return api(originalRequest);
      } catch {
        // Si el re-init falla, propagamos el error original de abajo
      }
    }

    // Solo errores 401 disparan el flujo de refresh
    if (status !== 401) {
      return Promise.reject(error);
    }

    if (!originalRequest._retry && !isLoggingOut) {
      if (isRefreshing) {
        return new Promise<string>(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            applyBearer(originalRequest, token);
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

        // Web: refresh sin body → el backend lee 'nova_refresh_token' de la cookie.
        // Native: enviamos el refresh token guardado en SecureStore.
        const response = await axios.post(
          `${API_URL}/Token/Refresh`,
          isValidToken(refreshToken) ? { RefreshToken: refreshToken } : {},
          {
            withCredentials: true,
            headers: { "X-Nova-Client": "nova-connect" },
          },
        );

        if (response.data.Succeeded && response.data.Data) {
          const { token: newToken, refreshToken: newRefreshToken } = await fetchTokensFromResponse(response);

          if (isValidToken(newToken)) {
            await storage.setItem("token", newToken);
          }
          if (isValidToken(newRefreshToken)) {
            await storage.setItem("refreshToken", newRefreshToken);
          }

          applyBearer(originalRequest, newToken);
          processQueue(null, newToken);
          return api(originalRequest);
        } else {
          throw new Error("Invalid refresh response");
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
