import { EnhancedStorage, StorageAccessState } from "./unpartitioned-storage";
import Cookies, { type CookieAttributes } from "js-cookie";

export class LocalStorage {
  private static instance: LocalStorage | null = null;
  private storage: EnhancedStorage;
  private static readonly DEVICE_NONCE_KEY = "DEVICE_NONCE";
  private static readonly SUPABASE_AUTH_PREFIX = "sb-";
  private static readonly SUPABASE_AUTH_SUFFIX = "-auth-token";

  // Maximum size for a single cookie chunk (about 4KB - some overhead)
  private static readonly MAX_COOKIE_CHUNK_SIZE = 3000;

  // Suffix for chunked cookies
  private static readonly CHUNK_SUFFIX = "_chunk_";
  private static readonly CHUNK_META_SUFFIX = "_chunk_meta";

  // Cookie options
  private static readonly COOKIE_OPTIONS: CookieAttributes = {
    path: "/",
    sameSite: "None",
    secure: true,
    expires: 365,
  };

  private static debugMode = process.env.NODE_ENV === "development";

  private constructor() {
    this.storage = new EnhancedStorage({ area: "local" });
  }

  static async getInstance(): Promise<LocalStorage> {
    if (!this.instance) {
      this.instance = new LocalStorage();
      await this.instance.storage.requestStorageAccess();
    }
    return this.instance;
  }

  /**
   * Determine the primary storage strategy based on access state
   * @returns Whether to use cookies as primary storage
   */
  private shouldUseCookiesAsPrimary(): boolean {
    // Only use cookies as primary when we have cookie access but not full access
    return this.storage.hasCookieAccess() && !this.storage.hasFullAccess();
  }

  /**
   * Check if this key should be stored in cookies
   */
  private shouldStoreInCookies(key: string): boolean {
    // Always use cookies for critical authentication data
    if (this.isAuthenticationKey(key)) {
      return true;
    }

    // For other data, only use cookies if that's our primary storage
    return this.shouldUseCookiesAsPrimary();
  }

  /**
   * Check if this is an authentication-related key
   */
  private isAuthenticationKey(key: string): boolean {
    return (
      key === LocalStorage.DEVICE_NONCE_KEY ||
      (key.startsWith(LocalStorage.SUPABASE_AUTH_PREFIX) && key.endsWith(LocalStorage.SUPABASE_AUTH_SUFFIX))
    );
  }

  /**
   * Set a cookie
   */
  private setCookie(key: string, value: string, options = LocalStorage.COOKIE_OPTIONS): boolean {
    try {
      Cookies.set(key, value, options);
      const result = Cookies.get(key);
      if (result === value) {
        return true;
      }
    } catch (e) {
      if (LocalStorage.debugMode) console.warn(`Failed to set cookie for key '${key}'`, e);
      return false;
    }
  }

  /**
   * Get a value from storage with appropriate method
   */
  private getStorageValue(key: string, useRaw = false): string | null {
    return useRaw ? this.storage.getRaw(key) : this.storage.getItem(key);
  }

  /**
   * Set a value to storage with appropriate method
   */
  private setStorageValue(key: string, value: string, useRaw = false): void {
    if (useRaw) {
      this.storage.setRaw(key, value);
    } else {
      this.storage.setItem(key, value);
    }
  }

  /**
   * Determine if we should use raw storage for a key
   */
  private shouldUseRawStorage(key: string): boolean {
    return key.startsWith(LocalStorage.SUPABASE_AUTH_PREFIX) && key.endsWith(LocalStorage.SUPABASE_AUTH_SUFFIX);
  }

  /**
   * Set a cookie with chunking if needed
   */
  private setCookieWithChunkingIfNeeded(key: string, value: string): boolean {
    // Check if value is too large for a single cookie
    if (value.length > LocalStorage.MAX_COOKIE_CHUNK_SIZE) {
      if (LocalStorage.debugMode) console.log(`Value for key '${key}' is large (${value.length} chars), chunking...`);
      return this.setChunkedCookies(key, value);
    }

    const success = this.setCookie(key, value);
    if (success && LocalStorage.debugMode) {
      console.log(`Cookie set successfully for: ${key}`);
    }
    return success;
  }

  /**
   * Set large values as multiple chunked cookies
   */
  private setChunkedCookies(key: string, value: string): boolean {
    try {
      // Clean up any existing chunks
      this.removeChunkedCookies(key);

      // Calculate chunks needed
      const chunkCount = Math.ceil(value.length / LocalStorage.MAX_COOKIE_CHUNK_SIZE);
      const metaKey = `${key}${LocalStorage.CHUNK_META_SUFFIX}`;

      // Set metadata first
      const metaSuccess = this.setCookie(metaKey, String(chunkCount));
      if (!metaSuccess) {
        if (LocalStorage.debugMode) console.error(`Failed to set metadata for chunked value ${key}`);
        return false;
      }

      // Store each chunk
      let allChunksSuccess = true;
      for (let i = 0; i < chunkCount; i++) {
        const chunkKey = `${key}${LocalStorage.CHUNK_SUFFIX}${i}`;
        const start = i * LocalStorage.MAX_COOKIE_CHUNK_SIZE;
        const end = Math.min(start + LocalStorage.MAX_COOKIE_CHUNK_SIZE, value.length);
        const chunk = value.substring(start, end);

        const chunkSuccess = this.setCookie(chunkKey, chunk);

        if (!chunkSuccess) {
          allChunksSuccess = false;
          if (LocalStorage.debugMode) console.error(`Failed to set chunk ${i} for key ${key}`);
        }
      }

      if (LocalStorage.debugMode) {
        if (allChunksSuccess) {
          console.log(`Successfully set ${chunkCount} chunks for key ${key}`);
        } else {
          console.warn(`Failed to set some chunks for key ${key}`);
        }
      }

      return allChunksSuccess;
    } catch (e) {
      if (LocalStorage.debugMode) console.error("Error in setChunkedCookies", e);
      return false;
    }
  }

  /**
   * Get a value potentially stored as multiple chunked cookies
   */
  private getChunkedCookies(key: string): string | null {
    try {
      const metaKey = `${key}${LocalStorage.CHUNK_META_SUFFIX}`;
      const metaValue = Cookies.get(metaKey);

      if (!metaValue) return null;

      const chunkCount = parseInt(metaValue, 10);
      if (isNaN(chunkCount) || chunkCount <= 0) {
        if (LocalStorage.debugMode) console.warn(`Invalid chunk count for key ${key}: ${metaValue}`);
        return null;
      }

      const chunks = new Array(chunkCount);
      let hasAllChunks = true;

      for (let i = 0; i < chunkCount; i++) {
        const chunkKey = `${key}${LocalStorage.CHUNK_SUFFIX}${i}`;
        const chunk = Cookies.get(chunkKey);

        if (chunk === undefined) {
          hasAllChunks = false;
          break;
        }

        chunks[i] = chunk;
      }

      if (!hasAllChunks) {
        if (LocalStorage.debugMode) console.warn(`Incomplete chunked value for key ${key}, fallback to localStorage`);
        const useRaw = this.shouldUseRawStorage(key);
        const localValue = this.getStorageValue(key, useRaw);

        if (localValue) {
          this.setCookieWithChunkingIfNeeded(key, localValue);
          return localValue;
        }

        return null;
      }

      if (LocalStorage.debugMode) console.log(`Retrieved ${chunkCount} chunks for key ${key}`);
      return chunks.join("");
    } catch (e) {
      if (LocalStorage.debugMode) console.error("Error in getChunkedCookies", e);
      return null;
    }
  }

  /**
   * Remove a cookie and handle all options
   */
  private removeCookie(key: string): void {
    Cookies.remove(key, LocalStorage.COOKIE_OPTIONS);
    Cookies.remove(key); // Default removal
  }

  /**
   * Remove all chunks for a given key
   */
  private removeChunkedCookies(key: string): void {
    try {
      const metaKey = `${key}${LocalStorage.CHUNK_META_SUFFIX}`;
      const metaValue = Cookies.get(metaKey);

      if (metaValue) {
        const chunkCount = parseInt(metaValue, 10);
        if (!isNaN(chunkCount) && chunkCount > 0) {
          // Remove all chunk cookies
          for (let i = 0; i < chunkCount; i++) {
            this.removeCookie(`${key}${LocalStorage.CHUNK_SUFFIX}${i}`);
          }
        }

        // Remove the metadata cookie
        this.removeCookie(metaKey);
      }
    } catch (e) {
      if (LocalStorage.debugMode) console.error("Error in removeChunkedCookies", e);
    }
  }

  /**
   * Get the current storage access state for debugging or UI feedback
   */
  getStorageAccessState(): StorageAccessState {
    return this.storage.accessState;
  }

  setItem(key: string, value: string): void {
    const useRaw = this.shouldUseRawStorage(key);
    const useCookiesAsPrimary = this.shouldUseCookiesAsPrimary();
    const shouldBackupToCookies = this.shouldStoreInCookies(key);

    if (LocalStorage.debugMode) {
      console.log(
        `Setting ${key} with strategy: ${useCookiesAsPrimary && shouldBackupToCookies ? "cookies-primary" : "localStorage-primary"}`,
      );
    }

    // Store in cookies if needed
    if (shouldBackupToCookies && useCookiesAsPrimary) {
      if (LocalStorage.debugMode) {
        const reason = useCookiesAsPrimary ? "cookies-only access" : "auth data backup";
        console.log(`Setting cookie for key '${key}' (${reason}, value length: ${value.length})`);
      }
      this.setCookieWithChunkingIfNeeded(key, value);
    } else {
      this.setStorageValue(key, value, useRaw);
    }
  }

  getItem(key: string): string | null {
    const useRaw = this.shouldUseRawStorage(key);
    const useCookiesAsPrimary = this.shouldUseCookiesAsPrimary();
    const shouldBackupToCookies = this.shouldStoreInCookies(key);

    if (LocalStorage.debugMode) {
      console.log(
        `Getting ${key} with strategy: ${useCookiesAsPrimary && shouldBackupToCookies ? "cookies-primary" : "localStorage-primary"}`,
      );
    }

    // If cookies are primary or we should check cookies for this key
    if (useCookiesAsPrimary && shouldBackupToCookies) {
      try {
        if (LocalStorage.debugMode) console.log(`Checking cookie for key '${key}'`);

        let cookieValue = this.getChunkedCookies(key);

        // If not found as chunks, try regular cookie
        if (cookieValue === null) {
          cookieValue = Cookies.get(key);
        }

        if (!cookieValue) {
          const localValue = this.getStorageValue(key, useRaw);

          if (localValue !== null) {
            if (LocalStorage.debugMode)
              console.log(
                `Cookie not found for '${key}', setting from localStorage value (length: ${localValue.length})`,
              );

            const success = this.setCookieWithChunkingIfNeeded(key, localValue);
            if (LocalStorage.debugMode) console.log(`Cookie set success: ${success}`);

            return localValue;
          }
        }

        return cookieValue;
      } catch (error) {
        console.warn("Failed to get cookie:", error);
      }
    }

    // If cookies aren't primary or we didn't find in cookies, try localStorage
    return this.getStorageValue(key, useRaw);
  }

  removeItem(key: string): void {
    // Always remove from localStorage
    this.storage.removeItem(key);

    // If we're using cookies for this key, remove from there too
    if (this.shouldStoreInCookies(key)) {
      try {
        if (LocalStorage.debugMode) console.log(`Removing cookie for key '${key}'`);
        this.removeChunkedCookies(key);
        this.removeCookie(key);
      } catch (error) {
        console.warn("Failed to remove cookie:", error);
      }
    }
  }

  clear(): void {
    // Clear localStorage
    this.storage.clear();

    try {
      // Only check actual cookies rather than all potential keys
      const cookies = Cookies.get() || {};

      Object.keys(cookies).forEach((key) => {
        if (this.shouldStoreInCookies(key) || key.includes(LocalStorage.CHUNK_SUFFIX)) {
          if (LocalStorage.debugMode) console.log(`Clearing cookie: ${key}`);
          this.removeCookie(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear cookies:", error);
    }
  }
}
