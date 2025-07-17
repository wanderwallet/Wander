import { isInsideIframe } from "~utils/embedded/iframe.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  HAS_SIMPLE_STORAGE_API,
  setUnpartitionedStateStatus,
  UNPARTITIONED_STATE_STATUS_CHANGE_EVENT,
  type UnpartitionedStateStatus,
  type UnpartitionedStateStatusChangeEvent,
} from "./unpartitioned-storage.utils";
import { isError } from "~utils/error/error.utils";
import {
  isComplexStorageItem,
  type ItemStorageOptions,
  type StorageItem,
} from "~iframe/storage/storage-manager/storage-manager.utils";
import { StorageManager } from "~iframe/storage/storage-manager/storage-manager";

type StorageType = "localStorage" | "sessionStorage";

interface EnhancedStorageOptions {
  area?: "local" | "session";
}

const timesInstantiated: Record<StorageType, number> = {
  localStorage: 0,
  sessionStorage: 0,
};

export class EnhancedStorage implements Storage {
  public storage: Storage;

  public storageType: StorageType;

  public status: UnpartitionedStateStatus | null = null;

  public error: Error | null = null;

  private requestStorageAccessPromise: Promise<UnpartitionedStateStatus> | null = null;

  private requestStorageAccessResolve: (status: UnpartitionedStateStatus) => void = () => {};

  constructor({ area = "local" }: EnhancedStorageOptions = {}) {
    this.storageType = area === "local" ? "localStorage" : "sessionStorage";
    this.storage = globalThis[this.storageType];

    const timesStorageTypeInstantiated = ++timesInstantiated[this.storageType];

    if (timesStorageTypeInstantiated > 1) {
      if (process.env.NODE_ENV === "development") {
        throw new Error(
          `${this.storageType} instantiated ${timesStorageTypeInstantiated} times. Was this intentional?`,
        );
      } else {
        console.warn(`${this.storageType} instantiated ${timesStorageTypeInstantiated} times. Was this intentional?`);
      }
    }

    if (area === "session") {
      // We want to start fresh each time the app loads:
      this.storage.clear();
    }
  }

  protected async requestStorageAccessAndInitializeStorage(): Promise<UnpartitionedStateStatus> {
    if (!isInsideIframe())
      throw new Error("UnpartitionedStorage.requestStorageAccess() can only be called from within the iframe.");

    try {
      log(LOG_GROUP.STORAGE, `Requesting ${this.storageType} access with typed API`);

      // @ts-expect-error - Newer API with types may not be recognized by TypeScript
      const handle = await document.requestStorageAccess({
        [this.storageType]: true,
      });

      console.log("GOT HANDLE =", handle);

      // @ts-expect-error - Newer API may not be recognized by TypeScript
      if (handle && handle[this.storageType]) {
        this.storage = handle[this.storageType];
        this.dispatchUnpartitionedStateStatusChange("supported");
      } else {
        this.dispatchUnpartitionedStateStatusChange("limited");
      }
    } catch (error) {
      this.dispatchUnpartitionedStateStatusChange(error);
    }

    return this.status;
  }

  async requestStorageAccess(): Promise<UnpartitionedStateStatus> {
    if (!isInsideIframe()) throw new Error("UnpartitionedStorage.foo() can only be called from within the iframe.");

    console.log("INITIAL STATUS IS =", this.status);

    // Unpartitioned state access already accepted, limited or unsupported:
    if (["supported", "limited", "unsupported"].includes(this.status)) {
      return this.status;
    }

    // If the code below runs, this.status can only be null, "error" or "rejected":

    if (this.requestStorageAccessPromise && this.status === null) {
      return this.requestStorageAccessPromise;
    }

    return (this.requestStorageAccessPromise = new Promise<UnpartitionedStateStatus>(async (resolve) => {
      // With this, calling dispatchUnpartitionedStateStatusChange() will automatically call resolve() too:
      this.requestStorageAccessResolve = resolve;

      // Storage Access API not supported:
      if (!HAS_SIMPLE_STORAGE_API) return this.dispatchUnpartitionedStateStatusChange("unsupported");

      try {
        // Check if we already have access:

        const hasAccess = await document.hasStorageAccess();

        console.log("hasAccess =", hasAccess);

        if (hasAccess) return await this.requestStorageAccessAndInitializeStorage();

        console.log("LISTENING FOR PERMISSION CHANGES");

        // If no access, check permission state:

        let permissionState: PermissionState = "prompt"; // Default

        if (navigator.permissions) {
          try {
            const permission = await navigator.permissions.query({
              name: "storage-access" as PermissionName,
            });

            permissionState = permission.state;

            permission.addEventListener("change", () => {
              log(LOG_GROUP.STORAGE, `Storage access permission changed to ${permission.state}`);

              this.handleStorageAccessPermission(permission.state);
            });
          } catch (error) {
            log(LOG_GROUP.STORAGE, "Error checking permission:", error);
          }
        }

        this.handleStorageAccessPermission(permissionState);
      } catch (error) {
        this.dispatchUnpartitionedStateStatusChange(error);
      }
    }));
  }

  private async handleStorageAccessPermission(permissionState: PermissionState) {
    // Handle based on permission state
    if (permissionState === "granted") {
      // Already granted to another same-site embed, can request directly
      await this.requestStorageAccess();
    } else if (permissionState === "prompt") {
      // Need user interaction to request
      this.setupUserInteractionHandler();
    } else if (permissionState === "denied") {
      // User has denied access
      this.dispatchUnpartitionedStateStatusChange("rejected");
    }
  }

  /**
   * Set up a handler to request storage access on user interaction
   * This is required by the Storage Access API for security
   */
  protected setupUserInteractionHandler(): void {
    log(LOG_GROUP.STORAGE, "Waiting for user interaction to request storage access");

    // Create a reusable handler function
    const handleUserInteraction = async () => {
      try {
        await this.requestStorageAccess();
        log(LOG_GROUP.STORAGE, "Storage access granted after user interaction");

        // Clean up event listeners after successful request
        cleanupListeners();
      } catch (error) {
        log(LOG_GROUP.STORAGE, "Storage access denied after user interaction:", error);
      }
    };

    // Function to clean up event listeners
    const cleanupListeners = () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("pointerdown", handleUserInteraction);
    };

    // Add event listeners with once:true to auto-remove after firing
    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("pointerdown", handleUserInteraction, {
      once: true,
    });

    // Also clean up after a timeout if user never interacts
    setTimeout(cleanupListeners, 300000); // 5 minutes
  }

  /**
   * Handle the case when unpartitioned storage access is denied or unavailable
   */
  protected dispatchUnpartitionedStateStatusChange(
    unpartitionedStateStatusOrError: UnpartitionedStateStatus | Error,
  ): UnpartitionedStateStatus {
    const unpartitionedStateStatus = isError(unpartitionedStateStatusOrError)
      ? "error"
      : unpartitionedStateStatusOrError;

    if (unpartitionedStateStatus === "error") {
      this.error = isError(unpartitionedStateStatusOrError)
        ? unpartitionedStateStatusOrError
        : new Error("Unexpected unpartitioned state error");
    } else {
      this.error = null;
    }

    log(LOG_GROUP.STORAGE, `Unpartitioned state access for ${this.storageType} = ${unpartitionedStateStatus}`);

    setUnpartitionedStateStatus(unpartitionedStateStatus);

    document.dispatchEvent(
      new CustomEvent(UNPARTITIONED_STATE_STATUS_CHANGE_EVENT, {
        detail: {
          unpartitionedStateStatus,
          error: this.error,
        },
        bubbles: true,
      }) satisfies UnpartitionedStateStatusChangeEvent,
    );

    this.requestStorageAccessResolve(unpartitionedStateStatus);

    return (this.status = unpartitionedStateStatus);
  }

  /**
   * Get raw value directly from storage without parsing or expiration checks
   *
   * @param key The key to retrieve
   * @returns The raw value as stored
   */
  getRaw(key: string): string | null {
    return this.storage.getItem(key);
  }

  /**
   * Get an item from storage with proper typing and expiration handling
   * @param key The key to retrieve
   * @returns The value or null if not found or expired
   */
  getItem<T = string>(key: string, defaultValue?: T): T | null {
    const rawValue = this.getRaw(key);
    defaultValue = defaultValue === undefined && arguments.length < 2 ? null : defaultValue;
    if (!rawValue) return defaultValue;

    try {
      const parsed = JSON.parse(rawValue) as StorageItem<T>;

      // Check if it's a complex storage item
      if (isComplexStorageItem<T>(parsed)) {
        // Check for expiration
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          // Item has expired, remove it
          this.removeItem(key);
          return defaultValue;
        }
        return parsed.value;
      }

      // If it's not a complex item, return as is
      return parsed as T;
    } catch (e) {
      // If parsing fails, return the raw value (for backwards compatibility)
      return rawValue as unknown as T;
    }
  }

  /**
   * Set an item in storage with optional expiration and priority
   * @param key The key to store
   * @param value The value to store
   * @param options Optional expiration and priority settings
   */
  setItem<T>(key: string, value: T, options?: ItemStorageOptions): void {
    // If no options or no expiration/priority options, store the value directly
    if (!options || (!options.expiresIn && options.priority === undefined)) {
      this.setRaw(key, JSON.stringify(value));
      return;
    }

    // Create a complex StorageItem with the provided properties
    const item: { value: T; expiresAt?: number; priority?: number } = { value };

    if (options.expiresIn !== undefined) {
      item.expiresAt = Date.now() + options.expiresIn;
    }

    if (options.priority !== undefined) {
      item.priority = options.priority;
    }

    this.setRaw(key, JSON.stringify(item));
  }

  /**
   * Direct storage access for auth tokens and other data that
   * should bypass enhanced features.
   *
   * @param key The key to store
   * @param value The value to store exactly as provided
   */
  setRaw(key: string, value: string): void {
    // Store directly in the underlying storage without any processing
    this.storage.setItem(key, value);
  }

  /**
   * Remove an item from storage
   * @param key The key to remove
   */
  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  /**
   * Clear all items from storage
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Get the key at the specified index
   * @param index The index of the key
   * @returns The key at the specified index or null if not found
   */
  key(index: number): string | null {
    return this.storage.key(index);
  }

  /**
   * Get the number of items in storage
   */
  get length(): number {
    return this.storage.length;
  }

  /**
   * Get all keys in storage
   * @returns An array of all keys in storage
   */
  keys(): string[] {
    return Object.keys(this.storage);
  }

  /**
   * Get multiple items from storage
   * @param keys The keys to retrieve
   * @returns An object with the keys and their values
   */
  getItems<T = string>(keys: string[], defaultValue?: T): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    defaultValue = defaultValue === undefined && arguments.length < 2 ? null : defaultValue;

    for (const key of keys) {
      result[key] = this.getItem<T>(key, defaultValue);
    }

    return result;
  }

  /**
   * Set multiple items in storage
   * @param items An object with keys and values to store
   * @param options Optional expiration and priority settings
   */
  setItems<T>(items: Record<string, T>, options?: ItemStorageOptions): void {
    for (const [key, value] of Object.entries(items)) {
      this.setItem(key, value, options);
    }
  }

  /**
   * Remove multiple items from storage
   * @param keys The keys to remove
   */
  removeItems(keys: string[]): void {
    for (const key of keys) {
      this.removeItem(key);
    }
  }

  /**
   * Set an item with predefined priority levels
   * @param key The key to store
   * @param value The value to store
   * @param priority One of the predefined priority levels
   * @param expiresIn Optional time in milliseconds until the item expires
   */
  setPrioritizedItem<T>(
    key: string,
    value: T,
    priority: keyof typeof StorageManager.PRIORITY_LEVELS,
    expiresIn?: number,
  ): void {
    this.setItem(key, value, {
      priority: StorageManager.PRIORITY[priority],
      expiresIn,
    });
  }

  /**
   * Store cache data with automatic expiration and lower priority
   * @param key The key to store
   * @param value The value to store
   * @param maxAge Maximum age in milliseconds
   */
  setCache<T>(key: string, value: T, maxAge: number = 3600000): void {
    this.setPrioritizedItem(key, value, "LOW", maxAge);
  }

  /**
   * Store user preferences with high priority and no expiration
   * @param key The key to store
   * @param value The value to store
   */
  setPreference<T>(key: string, value: T): void {
    this.setPrioritizedItem(key, value, "HIGH");
  }

  /**
   * Store temporary data that can be easily evicted
   * @param key The key to store
   * @param value The value to store
   * @param maxAge Maximum age in milliseconds (default 5 minutes)
   */
  setTemporary<T>(key: string, value: T, maxAge: number = 300000): void {
    this.setPrioritizedItem(key, value, "TEMPORARY", maxAge);
  }

  /**
   * Store critical data that should not be evicted
   * @param key The key to store
   * @param value The value to store
   */
  setCritical<T>(key: string, value: T): void {
    this.setPrioritizedItem(key, value, "CRITICAL");
  }

  /**
   * Checks if storage has enough space available, without aggressive eviction
   * @param bytesNeeded Bytes needed for new items
   * @returns True if sufficient space is available
   */
  hasAvailableSpace(bytesNeeded: number): boolean {
    // Clear expired items as this is always safe to do
    StorageManager.clearExpiredItems(this.storage);

    // Check current usage after removing expired items
    const usage = StorageManager.calculateStorageUsage(this.storage);
    const available = StorageManager.getStorageLimit() - usage.currentSize;

    return bytesNeeded <= available;
  }

  /**
   * Ensures space is available for new data, using progressive strategies
   * @param bytesNeeded Bytes needed for new items
   * @param options Configuration options
   * @returns True if space was ensured, false if impossible
   */
  ensureSpace(bytesNeeded: number, options: { skipCheck?: boolean; forceEviction?: boolean } = {}): boolean {
    // Skip availability check if requested
    if (!options.skipCheck) {
      const hasSpace = this.hasAvailableSpace(bytesNeeded);
      if (hasSpace) return true;
    }

    // Proceed to eviction if needed or forced
    return this.evictIfNeeded(bytesNeeded, options.forceEviction);
  }

  /**
   * Evicts items from storage based on priority until enough space is available
   * @param bytesNeeded Bytes needed to free up
   * @param aggressive If true, uses more aggressive eviction strategy
   * @returns True if eviction was successful, false if impossible
   */
  evictIfNeeded(bytesNeeded: number, aggressive: boolean = false): boolean {
    // Calculate target eviction size with different buffer strategies
    const limit = StorageManager.getStorageLimit();
    const bufferSize = aggressive ? 1024 : Math.max(limit * 0.1, 5120); // 5KB or 10%

    return StorageManager.evictItems(this.storage, bytesNeeded, {
      bufferSize,
      aggressive,
    });
  }

  /**
   * Get current storage usage information
   */
  getUsageInfo(): {
    bytes: number;
    percentage: number;
    items: number;
    available: number;
  } {
    const usage = StorageManager.calculateStorageUsage(this.storage);
    const limit = StorageManager.getStorageLimit();

    return {
      bytes: usage.currentSize,
      percentage: (usage.currentSize / limit) * 100,
      items: usage.itemCount,
      available: limit - usage.currentSize,
    };
  }
}
