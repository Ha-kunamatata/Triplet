import { apiClient, tokenStorage } from './api';
import { ENDPOINTS } from '@constants/api';
import type { User, AuthTokens, LoginRequest, RegisterRequest, ApiResponse } from '@types/index';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      ENDPOINTS.auth.login,
      payload,
    );
    await tokenStorage.save(data.data.tokens.accessToken, data.data.tokens.refreshToken);
    return data.data;
  },

  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      ENDPOINTS.auth.register,
      payload,
    );
    await tokenStorage.save(data.data.tokens.accessToken, data.data.tokens.refreshToken);
    return data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.auth.logout);
    } finally {
      await tokenStorage.clear();
    }
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.auth.me);
    return data.data;
  },
};
