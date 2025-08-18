import { isInsideIframe } from "~utils/embedded/iframe.utils";
import { EnhancedStorage } from "./unpartitioned-storage";
import Cookies from "js-cookie";
import type { CookieAttributes } from "node_modules/@types/js-cookie";
import { getUnpartitionedStateStatus } from "~iframe/storage/unpartitioned-storage/unpartitioned-storage.utils";
import { DEVICE_NONCE_KEY } from "~utils/embedded/device-nonce/device-nonce.utils";
import { browserInfo } from "~utils/browser-info/browser-info.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { SUPABASE_AUTH_TOKEN_KEY_REGEXP } from "~utils/embedded/embedded.constants";

export class LocalStorage {
  private static instance: LocalStorage | null = null;

  // Maximum size for a single cookie chunk (about 4KB - some overhead)
  private static readonly MAX_COOKIE_CHUNK_SIZE = 3000;

  private static readonly NO_COOKIE_STORE_ERR = "CookieStore not supported";

  // Suffix for chunked cookies
  private static readonly CHUNK_SUFFIX = "_chunk_";
  private static readonly CHUNK_META_SUFFIX = "_chunk_meta";

  private storage: EnhancedStorage;
  private cookieStoreAvailable: boolean = false;
  private isHttps: boolean;

  private get JS_COOKIE_OPTIONS(): CookieAttributes {
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

    // Safari doesn't support the partitioned option in cookieStorage. See https://developer.mozilla.org/en-US/docs/Web/API/CookieStore#browser_compatibility
    // But it could be available soon (Safari Technology Preview 212). See https://web.swipeinsight.app/posts/safari-technology-preview-212-introduces-partitioned-cookie-storage-support-14295

    this.cookieStoreAvailable = typeof window !== "undefined" && !!window.cookieStore && !browserInfo.isSafari;

    if (getUnpartitionedStateStatus() === "limited") {
      if (this.cookieStoreAvailable) {
        console.log(`window.cookieStore will be used, with options =`, this.COOKIE_STORE_OPTIONS);
      } else {
        console.log(`jsCookie will be used, with options =`, this.JS_COOKIE_OPTIONS);
      }
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
   * Returns `true` if the given key should be stored using cookies instead of localStorage. This only happens for the
   * device nonce and the Supabsae auth token if and only if the unpartitioned state status is "limited", meaning,
   * unpartitioned state is supported but only for cookies.
   *
   * In any other case, like not having unpartitioned state support at all or if unpartitioned state for localStorage
   * is supported, we do not use cookies.
   */
  private shouldStoreInCookies(key: string): boolean {
    console.warn("shouldStoreInCookies getUnpartitionedStateStatus() =", getUnpartitionedStateStatus());

    if (getUnpartitionedStateStatus() !== "limited") return false;

    const shouldStoreInCookies = key === DEVICE_NONCE_KEY || SUPABASE_AUTH_TOKEN_KEY_REGEXP.test(key);

    if (window.location.hostname === "localhost" && shouldStoreInCookies) {
      console.warn(
        `${key} should be read/stored in cookies, but that won't work in localhost, so localStorage will be used instead. Please, retest in a preview environment.`,
      );

      return false;
    }

    return shouldStoreInCookies;
  }

  /**
   * Get access to the CookieStore API safely
   */
  private getCookieStore(): CookieStore | undefined {
    if (!this.cookieStoreAvailable) throw new Error(LocalStorage.NO_COOKIE_STORE_ERR);

    return window.cookieStore;
  }

  /**
   * Set a cookie using CookieStore API or js-cookie fallback
   */
  private async setCookie(key: string, value: string): Promise<boolean> {
    try {
      const cookieStore = this.getCookieStore();
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

      return true;
    } catch (err) {
      if (err.message !== LocalStorage.NO_COOKIE_STORE_ERR) console.warn(`Error setting cookie "${key}":`, err);

      try {
        // Fallback to js-cookie
        Cookies.set(key, value, this.JS_COOKIE_OPTIONS);
        const result = Cookies.get(key);

        if (result !== value) {
          throw new Error(`Failed to set jsCookie "${key}" = "${value}" ("${result}" read).`);
        }

        return true;
      } catch (jsCookieError) {
        console.warn(`Error setting cookie "${key}" with jsCookie:`, jsCookieError);
      }
    }

    return false;
  }

  /**
   * Get a cookie value using CookieStore API or js-cookie fallback
   */
  private async getCookieValue(key: string): Promise<string | null> {
    try {
      const cookieStore = this.getCookieStore();
      const cookie = await cookieStore.get(key);

      console.warn(`Getting cookie "${key}" =`, cookie);

      return cookie?.value || null;
    } catch (err) {
      if (err.message !== LocalStorage.NO_COOKIE_STORE_ERR) console.warn(`Error reading cookie "${key}":`, err);

      console.warn(`Getting jsCookie "${key}" =`, Cookies.get(key));

      try {
        return Cookies.get(key) || null;
      } catch (jsCookieError) {
        console.warn(`Error reading jsCookie "${key}":`, jsCookieError);
      }
    }

    return null;
  }

  /**
   * Get all cookies using CookieStore API or js-cookie fallback
   */
  private async getAllCookies(): Promise<Record<string, string>> {
    try {
      const cookieStore = this.getCookieStore();
      const cookies = await cookieStore.getAll();

      return cookies.reduce(
        (acc, cookie) => {
          acc[cookie.name] = cookie.value;
          return acc;
        },
        {} as Record<string, string>,
      );
    } catch (err) {
      if (err.message !== LocalStorage.NO_COOKIE_STORE_ERR) console.warn(`Error reading all cookies:`, err);

      try {
        return Cookies.get() || {};
      } catch (jsCookieError) {
        console.warn(`Error reading all jsCookies:`, jsCookieError);
      }
    }

    return {};
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
    } catch (err) {
      console.warn(`Error reading "${key}" from storage:`, err);
    }

    return null;
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
    } catch (err) {
      console.warn(`Error setting "${key}" in storage:`, err);
    }

    return false;
  }

  /**
   * Set a cookie with chunking if needed
   */
  private async setCookieWithChunkingIfNeeded(key: string, value: string): Promise<boolean> {
    if (!value) {
      throw new Error(`Attempted to set empty value for key '${key}'`);
    }

    // Check if value is too large for a single cookie
    if (value.length > LocalStorage.MAX_COOKIE_CHUNK_SIZE) {
      log(LOG_GROUP.STORAGE, `Value for key '${key}' is large (${value.length} chars), chunking...`);

      return this.setChunkedCookies(key, value);
    }

    const success = await this.setCookie(key, value);

    if (success) {
      log(LOG_GROUP.STORAGE, `Cookie set successfully for: ${key}`);
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
        throw new Error(`Failed to set metadata for chunked value ${key}`);
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

      if (allChunksSuccess) {
        log(LOG_GROUP.STORAGE, `Successfully set ${chunkCount} chunks for key ${key}`);
      }

      return allChunksSuccess;
    } catch (e) {
      console.warn("Error in setChunkedCookies:", e);

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
        throw new Error(`Invalid chunk count for key ${key}: ${metaValue}`);
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
        throw new Error(`Incomplete chunked value for key ${key}, fallback to localStorage`);
      }

      log(LOG_GROUP.STORAGE, `Retrieved ${chunkCount} chunks for key ${key}`);

      return chunks.join("");
    } catch (e) {
      console.warn("Error in getChunkedCookies:", e);

      return null;
    }
  }

  /**
   * Remove a cookie using CookieStore API or js-cookie fallback
   */
  private async removeCookie(key: string): Promise<void> {
    try {
      const cookieStore = this.getCookieStore();

      await cookieStore.delete({
        name: key,
        path: this.COOKIE_STORE_OPTIONS.path,
        partitioned: this.COOKIE_STORE_OPTIONS.partitioned,
      });
    } catch (err) {
      if (err.message !== LocalStorage.NO_COOKIE_STORE_ERR) console.warn(`Error removing cookie "${key}":`, err);

      try {
        Cookies.remove(key, this.JS_COOKIE_OPTIONS);
      } catch (jsCookieError) {
        console.warn(`Error removing jsCookie "${key}":`, jsCookieError);
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
      console.warn("Error in removeChunkedCookies:", e);
    }
  }

  /**
   * Set an item in storage, with appropriate backup strategies
   */
  async setItem<T>(key: string, value: T, useRaw = false): Promise<void> {
    if (!key) throw new Error("Missing key.");

    const shouldStoreInCookies = this.shouldStoreInCookies(key);

    log(LOG_GROUP.STORAGE, `Setting ${key} in ${shouldStoreInCookies ? "cookies" : "localStorage"}`);

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
    if (!key) throw new Error("Missing key.");

    const shouldStoreInCookies = this.shouldStoreInCookies(key);

    log(LOG_GROUP.STORAGE, `Getting ${key} from ${shouldStoreInCookies ? "cookies" : "localStorage"}`);

    if (shouldStoreInCookies) {
      try {
        let cookieValue = await this.getChunkedCookies(key);

        // If not found as chunks, try regular cookie
        if (cookieValue === null) {
          cookieValue = await this.getCookieValue(key);
        }

        return cookieValue as unknown as T;
      } catch (err) {
        console.warn("Failed to get cookie:", err);
      }
    } else {
      return this.getStorageValue<T>(key, useRaw);
    }
  }

  /**
   * Remove an item from all storage locations
   */
  async removeItem(key: string): Promise<void> {
    if (!key) throw new Error("Missing key.");

    const shouldStoreInCookies = this.shouldStoreInCookies(key);

    log(LOG_GROUP.STORAGE, `Removing ${key} from localStorage${shouldStoreInCookies ? " and cookies" : ""}`);

    // Always remove from localStorage:
    this.storage.removeItem(key);

    // If we're using cookies for this key, remove from there too:
    if (shouldStoreInCookies) {
      try {
        const removeCookiePromises = [this.removeChunkedCookies(key), this.removeCookie(key)];

        await Promise.all(removeCookiePromises);
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
    } catch (err) {
      console.warn("Failed to get keys from storage", err);
    }

    return [];
  }
}
