import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '@/lib/storage';

// Use local network IP for testing on physical device/emulator, or localhost for iOS simulator
const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5044' : 'http://localhost:5044');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para evitar bucles infinitos de logout
let isLoggingOut = false;
let globalLogoutCallback: (() => void) | null = null;

export const setGlobalLogoutCallback = (callback: () => void) => {
  globalLogoutCallback = callback;
};

// Request interceptor to add the token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from SecureStore', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !isLoggingOut) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (refreshToken) {
          // Implementar refresh logic si el backend de NovaApi lo soporta con Bearer
          // const response = await axios.post(`${API_URL}/Token/Refresh`, { token: refreshToken });
          // await storage.setItem('token', response.data.Token);
          // originalRequest.headers.Authorization = `Bearer ${response.data.Token}`;
          // return axios(originalRequest);
          
          // Por ahora simularemos un logout forzado al expirar para mantener seguridad
          throw new Error('Refresh not implemented, forcing logout');
        } else {
            throw new Error('No refresh token');
        }
      } catch (refreshError) {
        isLoggingOut = true;
        if (globalLogoutCallback) {
          globalLogoutCallback();
        }
        return Promise.reject(refreshError);
      } finally {
        isLoggingOut = false;
      }
    }

    return Promise.reject(error);
  }
);
