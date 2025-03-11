export interface CacheEntry<T> {
  value: T | null;
  timestamp: number;
}

export interface AutoLockSettings {
  enabled: boolean;
  timeout: number;
}
