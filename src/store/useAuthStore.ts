import { create } from 'zustand';
import type { User, AuthTokens } from '@types/index';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: true }),

  setTokens: (tokens) => set({ tokens }),

  logout: () =>
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));
