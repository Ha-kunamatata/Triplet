import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '@constants/api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}`,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - 토큰 자동 첨부
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - 토큰 만료 시 자동 갱신
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post(
              `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/auth/refresh`,
              { refreshToken },
            );

            await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
            this.instance.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

            return this.instance(originalRequest);
          } catch {
            await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
            // 로그아웃 처리는 store에서
          }
        }

        return Promise.reject(error);
      },
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.instance.get<T>(url, config);
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.instance.post<T>(url, data, config);
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.instance.put<T>(url, data, config);
  }

  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.instance.patch<T>(url, data, config);
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.instance.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();

export const tokenStorage = {
  save: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  },
  getAccessToken: () => SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
};
