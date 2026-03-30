import { useEffect } from 'react';
import { useAuthStore } from '@store/useAuthStore';
import { authService } from '@services/authService';
import { tokenStorage } from '@services/api';

/**
 * 앱 시작 시 저장된 토큰으로 자동 로그인을 시도합니다.
 */
export function useBootstrap() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          const user = await authService.getMe();
          setUser(user);
        }
      } catch {
        await tokenStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [setUser, setLoading]);
}

/**
 * 로그아웃 핸들러를 반환합니다.
 */
export function useLogout() {
  const { logout } = useAuthStore();

  return async () => {
    try {
      await authService.logout();
    } finally {
      logout();
    }
  };
}
