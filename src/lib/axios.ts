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
  withCredentials: Platform.OS === "web",
  headers: {
    "Content-Type": "application/json",
  },
});

let csrfToken = "";
let csrfRequest: Promise<void> | null = null;

// Renovación de la sesión. El backend rota el refresh token en cada uso, así que
// dos renovaciones simultáneas harían que la segunda usara un token ya invalidado.
// Un único vuelo compartido lo evita.
let refreshPromise: Promise<boolean> | null = null;

// Se invoca cuando la sesión ya no puede renovarse y hay que cerrar el acceso.
let globalLogoutCallback: (() => void) | null = null;

// Una vez cerrada la sesión no se vuelve a pedir el cierre. El propio
// POST /Token/Logout responde 401 cuando el token ya venció y, sin esta
// guarda, disparaba un logout en cascada: 401 -> logout -> 401 -> logout -> ...
let sessionClosed = false;

export const setGlobalLogoutCallback = (callback: () => void) => {
  globalLogoutCallback = callback;
};

/** Se invoca al iniciar sesión de nuevo para permitir un futuro cierre. */
export const markSessionOpen = () => {
  sessionClosed = false;
};

const isTokenEndpoint = (url?: string) =>
  (url ?? "").toLowerCase().includes("/token");

function readCookie(response: unknown, name: string): string {
  const headers = (response as { headers?: Record<string, unknown> })?.headers;
  const cookies = headers?.["set-cookie"];
  const cookieText = Array.isArray(cookies)
    ? cookies.join(", ")
    : String(cookies || "");
  return (
    cookieText.match(new RegExp(`(?:^|[,;]\\s*)${name}=([^;,\\s]+)`))?.[1] || ""
  );
}

/**
 * Renueva la sesión contra NovaApi.
 *
 * En web el refresh token viaja en una cookie HttpOnly y solo hay que pedir la
 * renovación; en nativo se envía en el cuerpo y se guardan los tokens que
 * devuelve la respuesta.
 */
async function renewSession(): Promise<boolean> {
  const refreshToken =
    Platform.OS === "web" ? null : await storage.getItem("refreshToken");

  const response = await api.post(
    "/Token/Refresh",
    refreshToken ? { RefreshToken: refreshToken } : {},
  );

  const body = response.data as { Succeeded?: boolean } | undefined;
  if (!body?.Succeeded) return false;

  if (Platform.OS !== "web") {
    const accessToken = readCookie(response, "nova_connect_access_token");
    if (!accessToken) return false;
    const rotatedRefresh = readCookie(response, "nova_connect_refresh_token");
    await storage.setItem("token", accessToken);
    if (rotatedRefresh) await storage.setItem("refreshToken", rotatedRefresh);
  }

  return true;
}

/**
 * Indica si hay con que renovar la sesion. En nativo es el refresh token del
 * almacenamiento seguro; en web la cookie de sesion, que el navegador envia
 * sola y la app no puede leer.
 */
async function hasRenewableCredential(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  return !!(await storage.getItem("refreshToken"));
}

async function closeSession(): Promise<void> {
  if (sessionClosed) return;
  sessionClosed = true;
  globalLogoutCallback?.();
}

// Request interceptor: agrega Token JWT y API Key móvil
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. JWT Bearer token (para endpoints protegidos post-login)
      config.headers["X-Nova-Client"] = "nova-connect";
      config.headers["X-Client-Platform"] =
        Platform.OS === "web" ? "web" : "native";
      const token =
        Platform.OS === "web" ? null : await storage.getItem("token");
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
      return Promise.reject(error);
    }
    // El backend excluye de CSRF los endpoints /Token* (login, refresh,
    // logout y la propia emission del token). Pedirselo ahi provocaba que un
    // refresh fallara al no poder obtener el token CSRF.
    if (
      Platform.OS === "web" &&
      ["post", "put", "patch", "delete"].includes(config.method || "") &&
      !isTokenEndpoint(config.url)
    ) {
      if (!csrfToken) {
        csrfRequest ??= api
          .get("/Token/CsrfToken")
          .then(({ data }) => {
            csrfToken = data.Data;
          })
          .finally(() => {
            csrfRequest = null;
          });
        await csrfRequest;
      }
      config.headers["X-CSRF-TOKEN"] = csrfToken;
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
    const originalRequest = error.config;

    // Los endpoints de /Token quedan fuera: un 401 del propio refresh o del
    // logout no debe cerrar la sesión ni provocar una cascada.
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isTokenEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Sin credencial no hay nada que renovar: en el pre-login (documento,
    // registro, ayuda) un 401 solo significa "no autorizado todavia".
    if (!(await hasRenewableCredential())) {
      return Promise.reject(error);
    }

    try {
      refreshPromise ??= renewSession().finally(() => {
        refreshPromise = null;
      });
      const renewed = await refreshPromise;
      if (!renewed) throw new Error("No se pudo renovar la sesión.");

      if (Platform.OS !== "web") {
        const token = await storage.getItem("token");
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
      }
      return api(originalRequest);
    } catch (refreshError) {
      await closeSession();
      return Promise.reject(refreshError);
    }
  },
);
