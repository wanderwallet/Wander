import {
  Storage as PlasmoStorage,
  type StorageCallbackMap,
  type StorageWatchCallback
} from "@plasmohq/storage";
import {
  EnhancedStorage,
  type ItemStorageOptions,
  StorageManager
} from "../unpartitioned-storage/unpartitioned-storage";

export interface StorageMockInterface extends PlasmoStorage {
  setItem<T>(
    key: string,
    value: T,
    options?: ItemStorageOptions
  ): Promise<void>;
  getItem<T>(key: string): Promise<T | undefined>;
  removeItem(key: string): Promise<void>;
  getItems<T>(keys: string[]): Promise<Record<string, T | undefined>>;
  removeItems(keys: string[]): Promise<void>;
  setItems(
    items: Record<string, any>,
    options?: ItemStorageOptions
  ): Promise<void>;
  watch(callbackMap: StorageCallbackMap): boolean;
  unwatch(callbackMap: StorageCallbackMap): null;
  unwatchAll(): void;
  setCache<T>(key: string, value: T, maxAge?: number): Promise<void>;
  setPreference<T>(key: string, value: T): Promise<void>;
  setTemporary<T>(key: string, value: T, maxAge?: number): Promise<void>;
  setCritical<T>(key: string, value: T): Promise<void>;
  evictIfNeeded(bytesNeeded?: number, aggressive?: boolean): Promise<boolean>;
  getUsageInfo(forceRefresh?: boolean): {
    bytes: number;
    percentage: number;
    items: number;
    available: number;
  };
  ensureSpace(
    bytesNeeded: number,
    options?: { skipCheck?: boolean; forceEviction?: boolean }
  ): Promise<boolean>;
  setPrioritizedItem<T>(
    key: string,
    value: T,
    priority: keyof typeof StorageManager.PRIORITY_LEVELS,
    expiresIn?: number
  ): Promise<void>;
  requestStorageAccess(): Promise<void>;
  requestAccessOnUserInteraction(): Promise<void>;
  hasAvailableSpace(bytesNeeded: number): Promise<boolean>;
  getRaw(key: string): Promise<string | null>;
  setRaw(key: string, value: string): Promise<void>;
  keys(): Promise<string[]>;
}

export class StorageMock extends PlasmoStorage implements StorageMockInterface {
  private storage: EnhancedStorage;

  constructor(area: "session" | "local" = "session") {
    super({ area });
    this.storage = new EnhancedStorage({ area });

    // This browser doesn't support the Storage Access API
    // so let's just hope we have access!
    if (!document.hasStorageAccess) return;

    // TODO: Can this be postponed until authentication to avoid requesting permissions too soon?
    // unpartitioned sessionStorage cannot be accessed from iframe as it is partitioned by both origin and browser tabs unlike localStorage.
    this.storage.requestStorageAccess();
  }

  get primaryClient(): chrome.storage.StorageArea {
    throw new Error("Method not implemented.");
  }

  get secondaryClient(): Storage {
    throw new Error("Method not implemented.");
  }

  get area(): "session" | "sync" | "local" | "managed" {
    return "session";
  }

  get hasWebApi(): boolean {
    return true;
  }

  get hasExtensionApi(): boolean {
    return false;
  }

  get copiedKeySet(): Set<string> {
    throw new Error("Method not implemented.");
  }

  setCopiedKeySet(keyList: string[]): void {
    // Do nothing...
  }

  get allCopied(): boolean {
    throw new Error("Method not implemented.");
  }

  // GET:

  getItem<T = string>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.storage.getItem(key, undefined));
  }

  getItems<T = string>(keys: string[]): Promise<Record<string, T | undefined>> {
    return Promise.resolve(this.storage.getItems(keys, undefined));
  }

  get: <T = string>(key: string) => Promise<T | undefined> = this.getItem;
  getMany: <T = any>(keys: string[]) => Promise<Record<string, T | undefined>> =
    this.getItems;

  // SET:

  setItem(
    key: string,
    rawValue: any,
    options?: ItemStorageOptions
  ): Promise<void> {
    return new Promise(async (resolve) => {
      await this.storePrevValue(key);
      this.storage.setItem(key, rawValue, options);
      this.callWatchers(key, rawValue);
      resolve();
    });
  }

  setItems(
    items: Record<string, any>,
    options?: ItemStorageOptions
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      this.storage.setItems(items, options);
      resolve();
    });
  }

  set: (key: string, rawValue: any) => Promise<null> = this.setItem as any;
  setMany: (items: Record<string, any>) => Promise<null> = this.setItems as any;

  // REMOVE  CLEAR

  removeItem(key: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.storePrevValue(key);
      this.storage.removeItem(key);
      this.callWatchers(key, undefined);
      resolve();
    });
  }

  removeItems(keys: string[]): Promise<void> {
    return new Promise<void>((resolve) => {
      this.storage.removeItems(keys);
      resolve();
    });
  }

  remove: (key: string) => Promise<void> = this.removeItem;
  removeMany: (keys: string[]) => Promise<void> = this.removeItems;

  removeAll: () => Promise<void> = () => {
    return new Promise<void>(() => {
      this.storage.clear();
    });
  };

  // WATCH:

  watchers: Record<string, StorageWatchCallback[]> = {};
  oldValues: Record<string, any> = {};

  async storePrevValue(key: string) {
    this.oldValues[key] = await this.get(key);
  }

  callWatchers(key: string, newValue: any) {
    const oldValue = this.oldValues[key];

    this.watchers[key]?.forEach((callback) => {
      try {
        callback(
          {
            newValue,
            oldValue
          },
          this.area
        );
      } catch (err) {
        console.warn("Error calling watcher:", err);
      }
    });
  }

  watch = (callbackMap: StorageCallbackMap) => {
    Object.entries(callbackMap).forEach(([key, callback]) => {
      this.watchers[key] ??= [];
      this.watchers[key].push(callback);
    });

    return true;
  };

  unwatch = (callbackMap: StorageCallbackMap) => {
    Object.entries(callbackMap).forEach(([key, callback]) => {
      const watchers = this.watchers[key] || [];
      const indexToDelete = watchers.indexOf(callback);

      if (indexToDelete !== -1) {
        watchers.splice(indexToDelete, 1);
      }
    });

    return null;
  };

  unwatchAll = () => {
    this.watchers = {};
  };

  // unpartitioned storage:
  async requestStorageAccess() {
    await this.storage.requestStorageAccess();
  }

  async requestAccessOnUserInteraction() {
    await this.storage.requestAccessOnUserInteraction();
  }

  // Additional methods:

  async hasAvailableSpace(bytesNeeded: number): Promise<boolean> {
    return this.storage.hasAvailableSpace(bytesNeeded);
  }

  async getRaw(key: string): Promise<string | null> {
    return this.storage.getRaw(key);
  }

  async setRaw(key: string, value: string): Promise<void> {
    return this.storage.setRaw(key, value);
  }

  async keys(): Promise<string[]> {
    return this.storage.keys();
  }

  /**
   * Store cache data with automatic expiration and lower priority
   */
  setCache<T>(key: string, value: T, maxAge: number = 3600000): Promise<void> {
    return new Promise((resolve) => {
      this.storage.setCache(key, value, maxAge);
      resolve();
    });
  }

  /**
   * Store user preferences with high priority and no expiration
   */
  setPreference<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      this.storage.setPreference(key, value);
      resolve();
    });
  }

  /**
   * Store temporary data that can be easily evicted
   */
  setTemporary<T>(
    key: string,
    value: T,
    maxAge: number = 300000
  ): Promise<void> {
    return new Promise((resolve) => {
      this.storage.setTemporary(key, value, maxAge);
      resolve();
    });
  }

  /**
   * Store critical data that should not be evicted
   */
  setCritical<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      this.storage.setCritical(key, value);
      resolve();
    });
  }

  /**
   * Check if storage is near capacity and evict items if needed
   */
  async evictIfNeeded(bytesNeeded: number = 0): Promise<boolean> {
    return this.storage.evictIfNeeded(bytesNeeded);
  }

  /**
   * Get the current storage usage information
   */
  getUsageInfo(): {
    bytes: number;
    percentage: number;
    items: number;
    available: number;
  } {
    return this.storage.getUsageInfo();
  }

  /**
   * Check if there's enough space for an item of the given size
   */
  async ensureSpace(bytesNeeded: number): Promise<boolean> {
    return this.storage.ensureSpace(bytesNeeded);
  }

  /**
   * Set an item with predefined priority levels
   */
  setPrioritizedItem<T>(
    key: string,
    value: T,
    priority: keyof typeof StorageManager.PRIORITY_LEVELS,
    expiresIn?: number
  ): Promise<void> {
    return new Promise((resolve) => {
      this.storage.setPrioritizedItem(key, value, priority, expiresIn);
      resolve();
    });
  }
}
