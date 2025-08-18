import { isInsideIframe } from "~utils/embedded/iframe.utils";
import { EnhancedStorage } from "./unpartitioned-storage";
import Cookies from "js-cookie";
import type { CookieAttributes } from "node_modules/@types/js-cookie";
import { getUnpartitionedStateStatus } from "~iframe/storage/unpartitioned-storage/unpartitioned-storage.utils";
import { DEVICE_NONCE_KEY } from "~utils/embedded/device-nonce/device-nonce.utils";

// TODO: Move to `embeda-pi`
const SUPABASE_AUTH_TOKEN_KEY_REGEXP = /^sb\-\w+\-auth\-token$/;

export class LocalStorage {
  private static instance: LocalStorage | null = null;

  private static readonly DEBUG_MODE = process.env.NODE_ENV === "development";

  // Maximum size for a single cookie chunk (about 4KB - some overhead)
  private static readonly MAX_COOKIE_CHUNK_SIZE = 3000;

  // Suffix for chunked cookies
  private static readonly CHUNK_SUFFIX = "_chunk_";
  private static readonly CHUNK_META_SUFFIX = "_chunk_meta";

  private storage: EnhancedStorage;
  private cookieStoreAvailable: boolean = false;
  private isHttps: boolean;

  // Cookie options
  private get COOKIE_OPTIONS(): CookieAttributes {
    return {
      path: "/",
      sameSite: !this.isHttps ? "Lax" : "None",
      expires: 365,
      secure: this.isHttps,
    };
  }

  private get COOKIE_STORE_OPTIONS(): Omit<CookieInit, "name" | "value"> {
    return {
      path: "/",
      sameSite: !this.isHttps ? "lax" : "none",
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      partitioned: false,
    };
  }

  private constructor() {
    this.storage = new EnhancedStorage({ area: "local" });

    this.isHttps = typeof location !== "undefined" && location.protocol === "https:";

    // this.cookieStoreAvailable =
    //  typeof window !== "undefined" && "cookieStore" in window && window.cookieStore !== undefined;

    if (LocalStorage.DEBUG_MODE) {
      console.log(`Storage initialized: isHttps=${this.isHttps}, cookieStoreAvailable=${this.cookieStoreAvailable}`);
    }
  }

  static async getInstance(): Promise<LocalStorage> {
    this.instance = this.instance ?? new LocalStorage();

    await this.instance.storage.requestStorageAccess();

    if (this.instance.storage === localStorage && getUnpartitionedStateStatus() === "supported" && isInsideIframe()) {
      if (process.env.NODE_ENV === "development") {
        throw new Error("Using partitioned state in a browser with unpartitioned state support.");
      } else {
        console.warn("Using partitioned state in a browser with unpartitioned state support.");
      }
    }

    return this.instance;
  }

  // TODO: This is not the most elegant solution for the use case in `StorageMock` (`plasmo-storage.mock.ts`). Refactor this later:

  static getInstanceWithoutWaiting(): LocalStorage {
    this.instance = this.instance ?? new LocalStorage();

    this.instance.storage.requestStorageAccess().then(() => {
      if (this.instance.storage === localStorage && getUnpartitionedStateStatus() === "supported" && isInsideIframe()) {
        if (process.env.NODE_ENV === "development") {
          throw new Error("Using partitioned state in a browser with unpartitioned state support.");
        } else {
          console.warn("Using partitioned state in a browser with unpartitioned state support.");
        }
      }
    });

    return this.instance;
  }

  /**
   * Determine the primary storage strategy based on access state
   * @returns Whether to use cookies as primary storage
   */
  /*
  private shouldUseCookiesAsPrimary(): boolean {
    // Only use cookies as primary when we have cookie access but not full access
    return this.storage.hasCookieAccess() && !this.storage.hasFullAccess();
  }
  */

  /**
   * Returns `true` if the given key should be stored using cookies instead of localStorage. This only happens for the
   * device nonce and the Supabsae auth token if and only if the unpartitioned state status is "limited", meaning,
   * unpartitioned state is supported but only for cookies.
   *
   * In any other case, like not having unpartitioned state support at all or if unpartitioned state for localStorage
   * is supported, we do not use cookies.
   */
  private shouldStoreInCookies(key: string): boolean {
    if (getUnpartitionedStateStatus() !== "limited") return false;

    return key === DEVICE_NONCE_KEY || SUPABASE_AUTH_TOKEN_KEY_REGEXP.test(key);
  }

  /**
   * Get access to the CookieStore API safely
   */
  private getCookieStore() {
    if (this.cookieStoreAvailable) return window.cookieStore;
    return undefined;
  }

  /**
   * Set a cookie using CookieStore API or js-cookie fallback
   */
  private async setCookie(key: string, value: string, options?: CookieAttributes): Promise<boolean> {
    const cookieOptions = options || this.COOKIE_OPTIONS;

    try {
      const cookieStore = this.getCookieStore();
      if (cookieStore) {
        const cookieOptions = {
          name: key,
          value,
          ...this.COOKIE_STORE_OPTIONS,
        };

        await cookieStore.set(cookieOptions);
        const result = await this.getCookieValue(key);

        if (result !== value) {
          throw new Error(`Failed to set cookie "${key}" = "${value}" ("${result}" read).`);
        }

        return result === value;
      } else {
        // Fallback to js-cookie
        Cookies.set(key, value, cookieOptions);
        const result = Cookies.get(key);

        if (result !== value) {
          throw new Error(`Failed to set jsCookie "${key}" = "${value}" ("${result}" read).`);
        }

        return result === value;
      }
    } catch (err) {
      if (LocalStorage.DEBUG_MODE) console.warn(`Error setting cookie "${key}":`, err);

      /*
      try {
        Cookies.set(key, value, cookieOptions);
        let result = Cookies.get(key);
        if (result !== value) {
          const useRaw = this.shouldUseRawStorage(key);
          return this.setStorageValue(key, value, useRaw);
        }
        return result === value;
      } catch (fallbackError) {
        if (LocalStorage.DEBUG_MODE) console.warn(`Fallback cookie set also failed for key '${key}'`, fallbackError);
      }
        */

      return false;
    }
  }

  /**
   * Get a cookie value using CookieStore API or js-cookie fallback
   */
  private async getCookieValue(key: string): Promise<string | null> {
    try {
      const cookieStore = this.getCookieStore();
      if (cookieStore) {
        const cookie = await cookieStore.get(key);

        console.warn(`Getting cookie "${key}" =`, cookie);

        return cookie?.value || null;
      } else {
        console.warn(`Getting jsCookie "${key}" =`, Cookies.get(key));

        return Cookies.get(key) || null;
      }
    } catch (err) {
      if (LocalStorage.DEBUG_MODE) console.warn(`Failed to get cookie "${key}":`, err);

      /*
      try {
        return Cookies.get(key) || null;
      } catch (fallbackError) {
        if (LocalStorage.DEBUG_MODE) console.warn(`Fallback cookie get also failed for key '${key}'`, fallbackError);
      }
      */

      return null;
    }
  }

  /**
   * Get all cookies using CookieStore API or js-cookie fallback
   */
  private async getAllCookies(): Promise<Record<string, string>> {
    try {
      const cookieStore = this.getCookieStore();
      if (cookieStore) {
        const cookies = await cookieStore.getAll();
        return cookies.reduce(
          (acc, cookie) => {
            acc[cookie.name] = cookie.value;
            return acc;
          },
          {} as Record<string, string>,
        );
      } else {
        return Cookies.get() || {};
      }
    } catch (e) {
      if (LocalStorage.DEBUG_MODE) console.warn(`Failed to get all cookies`, e);

      /*
      try {
        return Cookies.get() || {};
      } catch (fallbackError) {
        if (LocalStorage.DEBUG_MODE) console.warn(`Fallback getAll cookies also failed`, fallbackError);
      }
      */

      return {};
    }
  }

  private async getAllStorageCookieKeys(): Promise<string[]> {
    const allCookies = await this.getAllCookies();

    return Object.keys(allCookies).filter(
      (key) => this.shouldStoreInCookies(key) || key.includes(LocalStorage.CHUNK_SUFFIX),
    );
  }

  /**
   * Get a value from storage with appropriate method
   */
  private getStorageValue<T = string>(key: string, useRaw = false): T | null {
    try {
      return useRaw ? (this.storage.getRaw(key) as T) : (this.storage.getItem(key) as T);
    } catch (e) {
      if (LocalStorage.DEBUG_MODE) console.warn(`Failed to get storage value for key '${key}'`, e);
      return null;
    }
  }

  /**
   * Set a value to storage with appropriate method
   */
  private setStorageValue<T>(key: string, value: T, useRaw = false): boolean {
    try {
      if (useRaw) {
        this.storage.setRaw(key, value as string);
      } else {
        this.storage.setItem(key, value);
      }
      return true;
    } catch (e) {
      if (LocalStorage.DEBUG_MODE) console.warn(`Failed to set storage value for key '${key}'`, e);
      return false;
    }
  }

  /**
   * Set a cookie with chunking if needed
   */
  private async setCookieWithChunkingIfNeeded(key: string, value: string): Promise<boolean> {
    if (!value) {
      if (LocalStorage.DEBUG_MODE) console.warn(`Attempted to set empty value for key '${key}'`);
      return false;
    }

    // Check if value is too large for a single cookie
    if (value.length > LocalStorage.MAX_COOKIE_CHUNK_SIZE) {
      if (LocalStorage.DEBUG_MODE) console.log(`Value for key '${key}' is large (${value.length} chars), chunking...`);
      return this.setChunkedCookies(key, value);
    }

    const success = await this.setCookie(key, value);
    if (success && LocalStorage.DEBUG_MODE) {
      console.log(`Cookie set successfully for: ${key}`);
    } else if (!success && LocalStorage.DEBUG_MODE) {
      console.warn(`Failed to set cookie for: ${key}`);
    }
    return success;
  }

  /**
   * Set large values as multiple chunked cookies
   */
  private async setChunkedCookies(key: string, value: string): Promise<boolean> {
    try {
      // Clean up any existing chunks
      await this.removeChunkedCookies(key);

      // Calculate chunks needed
      const chunkCount = Math.ceil(value.length / LocalStorage.MAX_COOKIE_CHUNK_SIZE);
      const metaKey = `${key}${LocalStorage.CHUNK_META_SUFFIX}`;

      // Set metadata first
      const metaSuccess = await this.setCookie(metaKey, String(chunkCount));
      if (!metaSuccess) {
        if (LocalStorage.DEBUG_MODE) console.error(`Failed to set metadata for chunked value ${key}`);
        return false;
      }

      // Store each chunk in parallel for better performance
      const chunkPromises = [];

      for (let i = 0; i < chunkCount; i++) {
        const chunkKey = `${key}${LocalStorage.CHUNK_SUFFIX}${i}`;
        const start = i * LocalStorage.MAX_COOKIE_CHUNK_SIZE;
        const end = Math.min(start + LocalStorage.MAX_COOKIE_CHUNK_SIZE, value.length);
        const chunk = value.substring(start, end);

        chunkPromises.push(this.setCookie(chunkKey, chunk));
      }

      // Wait for all chunks to be set
      const results = await Promise.all(chunkPromises);
      const allChunksSuccess = results.every(Boolean);

      if (LocalStorage.DEBUG_MODE) {
        if (allChunksSuccess) {
          console.log(`Successfully set ${chunkCount} chunks for key ${key}`);
        } else {
          console.warn(`Failed to set some chunks for key ${key}`);
        }
      }

      return allChunksSuccess;
    } catch (e) {
      if (LocalStorage.DEBUG_MODE) console.error("Error in setChunkedCookies", e);
      return false;
    }
  }

  /**
   * Get a value potentially stored as multiple chunked cookies
   */
  private async getChunkedCookies(key: string): Promise<string | null> {
    try {
      const metaKey = `${key}${LocalStorage.CHUNK_META_SUFFIX}`;
      const metaValue = await this.getCookieValue(metaKey);

      if (!metaValue) return null;

      const chunkCount = parseInt(metaValue, 10);
      if (isNaN(chunkCount) || chunkCount <= 0) {
        if (LocalStorage.DEBUG_MODE) console.warn(`Invalid chunk count for key ${key}: ${metaValue}`);
        return null;
      }

      // Fetch all chunks in parallel for better performance
      const chunkPromises = [];
      for (let i = 0; i < chunkCount; i++) {
        const chunkKey = `${key}${LocalStorage.CHUNK_SUFFIX}${i}`;
        chunkPromises.push(this.getCookieValue(chunkKey));
      }

      const chunks = await Promise.all(chunkPromises);

      // Check if any chunks are missing
      if (chunks.some((chunk) => chunk === null)) {
        if (LocalStorage.DEBUG_MODE) console.warn(`Incomplete chunked value for key ${key}, fallback to localStorage`);

        /*
        const useRaw = this.shouldUseRawStorage(key);
        const localValue = this.getStorageValue<string>(key, useRaw);

        if (localValue) {
          await this.setCookieWithChunkingIfNeeded(key, localValue);
          return localValue;
        }
        */

        return null;
      }

      if (LocalStorage.DEBUG_MODE) console.log(`Retrieved ${chunkCount} chunks for key ${key}`);
      return chunks.join("");
    } catch (e) {
      if (LocalStorage.DEBUG_MODE) console.error("Error in getChunkedCookies", e);
      return null;
    }
  }

  /**
   * Remove a cookie using CookieStore API or js-cookie fallback
   */
  private async removeCookie(key: string): Promise<void> {
    try {
      const cookieStore = this.getCookieStore();
      if (cookieStore) {
        await cookieStore.delete({
          name: key,
          path: this.COOKIE_STORE_OPTIONS.path,
          partitioned: this.COOKIE_STORE_OPTIONS.partitioned,
        });
      } else {
        Cookies.remove(key, this.COOKIE_OPTIONS);
      }
    } catch (e) {
      if (LocalStorage.DEBUG_MODE) console.warn(`Failed to remove cookie for key '${key}'`, e);
      try {
        Cookies.remove(key, this.COOKIE_OPTIONS);
      } catch (fallbackError) {
        if (LocalStorage.DEBUG_MODE) console.warn(`Fallback cookie remove also failed for key '${key}'`, fallbackError);
      }
    }
  }

  /**
   * Remove all chunks for a given key
   */
  private async removeChunkedCookies(key: string): Promise<void> {
    try {
      const metaKey = `${key}${LocalStorage.CHUNK_META_SUFFIX}`;
      const metaValue = await this.getCookieValue(metaKey);

      if (metaValue) {
        const chunkCount = parseInt(metaValue, 10);
        if (!isNaN(chunkCount) && chunkCount > 0) {
          // Remove all chunk cookies in parallel
          const removePromises = [];
          for (let i = 0; i < chunkCount; i++) {
            removePromises.push(this.removeCookie(`${key}${LocalStorage.CHUNK_SUFFIX}${i}`));
          }
          await Promise.all(removePromises);
        }

        // Remove the metadata cookie
        await this.removeCookie(metaKey);
      }
    } catch (e) {
      if (LocalStorage.DEBUG_MODE) console.error("Error in removeChunkedCookies", e);
    }
  }

  /**
   * Set an item in storage, with appropriate backup strategies
   */
  async setItem<T>(key: string, value: T, useRaw = false): Promise<void> {
    if (!key) {
      // TODO: Wouldn't this throw an error already? Otherwise, it should.
      if (LocalStorage.DEBUG_MODE) console.warn("Attempted to set a value with an empty key");
      return;
    }

    const shouldStoreInCookies = this.shouldStoreInCookies(key);

    if (LocalStorage.DEBUG_MODE) {
      // TODO: Use logger:
      console.log(`Setting ${key} in ${shouldStoreInCookies ? "cookies" : "localStorage"}`);
    }

    /*
    if (shouldBackupToCookies && useCookiesAsPrimary) {
      if (LocalStorage.DEBUG_MODE) {
        const reason = useCookiesAsPrimary ? "cookies-only access" : "auth data backup";
        console.log(
          `Setting cookie for key '${key}' (${reason}, value length: ${typeof value === "string" ? value.length : JSON.stringify(value).length})`,
        );
      }
      await this.setCookieWithChunkingIfNeeded(key, value as string);
    } else {
      // When not in iframe, always store shared data in both localStorage and cookies
      if (!isInsideIframe() && shouldBackupToCookies) {
        if (LocalStorage.DEBUG_MODE) {
          console.log(`Not in iframe, storing shared data '${key}' in both localStorage and cookies`);
        }
        await this.setCookieWithChunkingIfNeeded(key, value as string);
      }
      this.setStorageValue(key, value, useRaw);
    }
    */

    if (shouldStoreInCookies) {
      await this.setCookieWithChunkingIfNeeded(key, value as string);
    } else {
      this.setStorageValue(key, value, useRaw);
    }
  }

  /**
   * Get an item from storage, with appropriate fallback strategies
   */
  async getItem<T = string>(key: string, useRaw = false): Promise<T | null> {
    if (!key) {
      // TODO: Wouldn't this throw an error already? Otherwise, it should.
      if (LocalStorage.DEBUG_MODE) console.warn("Attempted to get a value with an empty key");
      return null;
    }

    const shouldStoreInCookies = this.shouldStoreInCookies(key);

    if (LocalStorage.DEBUG_MODE) {
      // TODO: Use logger:
      console.log(`Getting ${key} from ${shouldStoreInCookies ? "cookies" : "localStorage"}`);
    }

    /*
    if (useCookiesAsPrimary && shouldBackupToCookies) {
      try {
        if (LocalStorage.DEBUG_MODE) console.log(`Checking cookie for key '${key}'`);

        let cookieValue = await this.getChunkedCookies(key);

        // If not found as chunks, try regular cookie
        if (cookieValue === null) {
          cookieValue = await this.getCookieValue(key);
        }

        if (!cookieValue) {
          const localValue = this.getStorageValue<T>(key, useRaw);

          if (localValue !== null) {
            if (LocalStorage.DEBUG_MODE)
              console.log(
                `Cookie not found for '${key}', setting from localStorage value (length: ${
                  typeof localValue === "string" ? localValue.length : JSON.stringify(localValue).length
                })`,
              );

            if (typeof localValue === "string") {
              const success = await this.setCookieWithChunkingIfNeeded(key, localValue);
              if (LocalStorage.DEBUG_MODE) console.log(`Cookie set success: ${success}`);
            }

            return localValue;
          }
        }

        return cookieValue as unknown as T;
      } catch (error) {
        console.warn("Failed to get cookie:", error);
      }
    }

    // If cookies aren't primary or we didn't find in cookies, try localStorage
    return this.getStorageValue<T>(key, useRaw);
    */

    if (shouldStoreInCookies) {
      try {
        if (LocalStorage.DEBUG_MODE) console.log(`Checking cookie for key '${key}'`);

        let cookieValue = await this.getChunkedCookies(key);

        // If not found as chunks, try regular cookie
        if (cookieValue === null) {
          cookieValue = await this.getCookieValue(key);
        }

        return cookieValue as unknown as T;
      } catch (error) {
        // TODO: Shouldn't this be thrown?
        console.warn("Failed to get cookie:", error);
      }
    } else {
      return this.getStorageValue<T>(key, useRaw);
    }
  }

  /**
   * Remove an item from all storage locations
   */
  async removeItem(key: string): Promise<void> {
    if (!key) {
      if (LocalStorage.DEBUG_MODE) console.warn("Attempted to remove a value with an empty key");
      return;
    }

    // Always remove from localStorage
    this.storage.removeItem(key);

    // If we're using cookies for this key, remove from there too
    if (this.shouldStoreInCookies(key)) {
      try {
        if (LocalStorage.DEBUG_MODE) console.log(`Removing cookie for key '${key}'`);
        await this.removeChunkedCookies(key);
        await this.removeCookie(key);
      } catch (error) {
        console.warn("Failed to remove cookie:", error);
      }
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    // Clear localStorage
    this.storage.clear();

    try {
      const storageCookieKeys = await this.getAllStorageCookieKeys();
      const removePromises = storageCookieKeys.map((key) => this.removeCookie(key));

      await Promise.all(removePromises);
    } catch (error) {
      console.warn("Failed to clear cookies:", error);
    }
  }

  /**
   * Get all keys from localStorage
   */
  async keys(): Promise<string[]> {
    try {
      const storageCookieKeys = await this.getAllStorageCookieKeys();

      return [...new Set([...this.storage.keys(), ...storageCookieKeys])];
    } catch (e) {
      if (LocalStorage.DEBUG_MODE) console.warn("Failed to get keys from storage", e);
      return [];
    }
  }
}
