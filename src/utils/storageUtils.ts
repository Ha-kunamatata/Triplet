import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * JSON 직렬화를 포함한 AsyncStorage 래퍼
 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },

  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    const pairs = await AsyncStorage.multiGet(keys);
    return Object.fromEntries(
      pairs.map(([k, v]) => [k, v ? (JSON.parse(v) as T) : null]),
    );
  },
};

export const STORAGE_KEYS = {
  RECENT_SEARCHES: 'recent_searches',
  PREFERRED_CURRENCY: 'preferred_currency',
  ONBOARDING_DONE: 'onboarding_done',
} as const;
