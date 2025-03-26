import { isInsideIframe } from "~utils/embedded/iframe.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";

type StorageType = "localStorage" | "sessionStorage";
interface UnpartitionedStorageOptions {
  area?: "local" | "session";
}

export type StorageItem<T = string> =
  | T
  | {
      /**
       * The value to store.
       */
      value: T;
      /**
       * The expiration unix timestamp of the item.
       * Optional, but either this or priority should be present.
       */
      expiresAt?: number;
      /**
       * Higher number = higher priority (less likely to be evicted).
       * Optional, but either this or expiresAt should be present.
       */
      priority?: number;
    };

export interface ItemStorageOptions {
  expiresIn?: number;
  priority?: number;
}

/**
 * Helper method to determine if a parsed item is a complex StorageItem with metadata
 */
function isComplexStorageItem<T>(
  item: any,
  requiredMetadata: {
    expiresAt?: boolean;
    priority?: boolean;
  } = {}
): item is { value: T; expiresAt?: number; priority?: number } {
  // Early bailout checks for non-objects
  if (!item || typeof item !== "object" || item === null) {
    return false;
  }

  // Check for required value property
  if (!("value" in item)) {
    return false;
  }

  // Check for at least one metadata property
  const hasExpiresAt = "expiresAt" in item;
  const hasPriority = "priority" in item;

  if (!hasExpiresAt && !hasPriority) {
    return false;
  }

  // Check specific required options if provided
  if (requiredMetadata.expiresAt && !hasExpiresAt) {
    return false;
  }

  if (requiredMetadata.priority && !hasPriority) {
    return false;
  }

  return true;
}

/**
 * Storage Manager for handling localStorage and sessionStorage eviction policies
 */
export class StorageManager {
  public static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB default limit
  public static readonly DEFAULT_PRIORITY = 10; // Critical priority (scale of 1-10)
  public static readonly PRIORITY_LEVELS = {
    CRITICAL: 10, // System-critical data that should never be evicted
    HIGH: 8, // Important user preferences/settings
    MEDIUM: 5, // Regular application data
    LOW: 3, // Cache data that can be regenerated
    TEMPORARY: 1 // Short-lived or disposable data
  };

  // Add a last cleanup timestamp to avoid too frequent cleanups
  private static lastCleanupTime = 0;
  private static readonly CLEANUP_INTERVAL = 60000; // 1 minute

  /**
   * Evict items from storage based on priority and expiration
   * @param storage The storage object to manage
   * @param bytesNeeded Estimated bytes needed
   * @param options Eviction options
   * @returns True if eviction was successful or not needed
   */
  static evictItems(
    storage: Storage,
    bytesNeeded: number = 0,
    options: { bufferSize?: number; aggressive?: boolean } = {}
  ): boolean {
    const initialLength = storage.length;
    // Setup options with defaults
    const bufferSize = options.bufferSize ?? 1024;
    const aggressive = options.aggressive ?? false;

    // First, clear any expired items
    this.clearExpiredItems(storage, aggressive);

    // Calculate current usage
    const usage = this.calculateStorageUsage(storage);

    // No eviction needed if we have enough space
    if (usage.currentSize + bytesNeeded + bufferSize <= this.MAX_STORAGE_SIZE) {
      return true;
    }

    // Sort items by priority and expiration
    const sortedItems = this.getSortedStorageItems(storage);

    // Early exit if no items are available for eviction
    if (sortedItems.length === 0) {
      return false;
    }

    // Calculate target size - how much space we want to have after eviction
    const targetSize = this.MAX_STORAGE_SIZE - bytesNeeded - bufferSize;

    // Track current size instead of using initial usage
    let currentSize = usage.currentSize;
    let evictedCount = 0;

    // Determine the eviction threshold based on aggressiveness
    const evictionThreshold = aggressive
      ? this.PRIORITY_LEVELS.HIGH
      : this.PRIORITY_LEVELS.CRITICAL;

    // Evict items until we have enough space
    for (const item of sortedItems) {
      if (item.priority >= evictionThreshold) {
        continue;
      }

      try {
        storage.removeItem(item.key);
        currentSize -= item.size;
        evictedCount++;
      } catch (error) {
        // Log error but continue with other items
        console.error(`Failed to evict item ${item.key}:`, error);
        continue;
      }

      // Check progress periodically for performance
      if (evictedCount % 10 === 0) {
        if (currentSize <= targetSize) {
          return true;
        }
      }
    }

    // Verify storage wasn't modified during eviction
    if (storage.length !== initialLength - evictedCount) {
      // Storage was modified during eviction, recalculate
      const finalUsage = this.calculateStorageUsage(storage);
      return finalUsage.currentSize + bytesNeeded <= this.MAX_STORAGE_SIZE;
    }

    return currentSize + bytesNeeded <= this.MAX_STORAGE_SIZE;
  }

  /**
   * Clear all expired items from storage
   */
  static clearExpiredItems(storage: Storage, force = false): number {
    const now = Date.now();
    // Skip if we recently cleaned up and force isn't true
    if (!force && now - this.lastCleanupTime < this.CLEANUP_INTERVAL) {
      return 0;
    }

    // Skip if storage is empty
    if (storage.length === 0) {
      this.lastCleanupTime = now;
      return 0;
    }

    let clearedCount = 0;

    for (const key of Object.keys(storage)) {
      const rawValue = storage.getItem(key);
      if (!rawValue) continue;

      try {
        const parsed = JSON.parse(rawValue);

        if (
          isComplexStorageItem(parsed, { expiresAt: true }) &&
          parsed.expiresAt < now
        ) {
          storage.removeItem(key);
          clearedCount++;
        }
      } catch (e) {
        // Skip items that can't be parsed
      }
    }

    this.lastCleanupTime = now;
    return clearedCount;
  }

  /**
   * Efficiently calculates storage usage (in bytes) and item count for the given Storage object.
   * Uses TextEncoder to correctly handle multi-byte characters.
   *
   * @param storage The Storage object (localStorage or sessionStorage)
   * @returns An object with the total size in bytes and the item count.
   */
  static calculateStorageUsage(storage: Storage): {
    currentSize: number;
    itemCount: number;
  } {
    // Create encoder once and reuse
    const encoder = new TextEncoder();
    let totalBytes = 0;
    const count = storage.length;

    // Use a single array to store concatenated strings
    const buffer = new Array<string>(2);

    for (let i = 0; i < count; i++) {
      const key = storage.key(i);
      if (key !== null) {
        // Avoid string concatenation, use array positions instead
        buffer[0] = key;
        buffer[1] = storage.getItem(key) ?? "";
        // Join only when encoding to reduce string operations
        totalBytes += encoder.encode(buffer.join("")).length;
      }
    }

    return { currentSize: totalBytes, itemCount: count };
  }

  static calculateStorageUsageByKey(storage: Storage, key: string): number {
    const encoder = new TextEncoder();
    const buffer = new Array<string>(2);
    buffer[0] = key;
    buffer[1] = storage.getItem(key) ?? "";
    return encoder.encode(buffer.join("")).length;
  }

  static calculateStorageUsageByKeys(storage: Storage, keys: string[]): number {
    return keys.reduce(
      (acc, key) => acc + this.calculateStorageUsageByKey(storage, key),
      0
    );
  }

  /**
   * Get all storage items sorted by eviction criteria
   */
  static getSortedStorageItems(storage: Storage): Array<{
    key: string;
    size: number;
    priority: number;
    expiresAt: number;
  }> {
    const encoder = new TextEncoder();
    const now = Date.now();
    const items: Array<{
      key: string;
      size: number;
      priority: number;
      expiresAt: number;
    }> = [];

    // Extract all items with metadata
    Object.keys(storage).forEach((key) => {
      const rawValue = storage.getItem(key);
      if (!rawValue) return;

      const size = encoder.encode(key + rawValue).length;

      try {
        const parsed = JSON.parse(rawValue);

        // Check if it's a complex item with metadata
        if (isComplexStorageItem(parsed)) {
          items.push({
            key,
            size,
            priority: parsed.priority ?? this.DEFAULT_PRIORITY,
            expiresAt: parsed.expiresAt ?? Number.MAX_SAFE_INTEGER
          });
        } else {
          // Simple items get default priority
          items.push({
            key,
            size,
            priority: this.DEFAULT_PRIORITY,
            expiresAt: Number.MAX_SAFE_INTEGER
          });
        }
      } catch (e) {
        // Non-JSON items get lowest priority
        items.push({
          key,
          size,
          priority: this.DEFAULT_PRIORITY,
          expiresAt: Number.MAX_SAFE_INTEGER
        });
      }
    });

    // Multi-level sorting:
    // 1. Expired items first
    // 2. Then by priority (lowest first)
    // 3. Then by size (largest first to free up more space quickly)
    // 4. Finally by expiration (soonest first)
    return items.sort((a, b) => {
      // Expired items first (can be combined with priority if both are expired)
      const aExpired = a.expiresAt < now;
      const bExpired = b.expiresAt < now;

      if (aExpired && !bExpired) return -1;
      if (!aExpired && bExpired) return 1;

      // Then by priority (lowest first)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Then by size (largest first)
      if (a.size !== b.size) {
        return b.size - a.size;
      }

      // Finally by expiration date
      return a.expiresAt - b.expiresAt;
    });
  }

  /**
   * Get priority levels for use in application code
   */
  static get PRIORITY(): typeof StorageManager.PRIORITY_LEVELS {
    return this.PRIORITY_LEVELS;
  }

  /**
   * Estimate size of an item before storing
   * @param key The key to store
   * @param value The value to store
   */
  static estimateItemSize<T>(key: string, value: T): number {
    const serialized = JSON.stringify(value);
    // 2 bytes per character for UTF-16 encoding + key length
    return (key.length + serialized.length) * 2;
  }

  /**
   * Get the current storage limit
   */
  static getStorageLimit(): number {
    return this.MAX_STORAGE_SIZE;
  }

  /**
   * Get the current storage usage percentage
   */
  static getStorageUsage(storage: Storage): {
    bytes: number;
    percentage: number;
    items: number;
  } {
    const usage = this.calculateStorageUsage(storage);
    return {
      bytes: usage.currentSize,
      percentage: (usage.currentSize / this.MAX_STORAGE_SIZE) * 100,
      items: usage.itemCount
    };
  }
}

export class EnhancedStorage implements Storage {
  protected storage: Storage;
  protected storageType: StorageType;

  constructor({ area = "local" }: UnpartitionedStorageOptions = {}) {
    this.storageType = area === "local" ? "localStorage" : "sessionStorage";
    this.storage = globalThis[this.storageType];

    if (area === "session") {
      // We want to start fresh each time the app loads:
      this.storage.clear();
    }
  }

  protected async getStorageHandle(): Promise<Storage> {
    // @ts-expect-error - requestStorageAccess should return a handle
    const handle = await document.requestStorageAccess({
      [this.storageType]: true
    });

    return handle[this.storageType];
  }

  protected setupUserInteractionHandler() {
    document.addEventListener(
      "click",
      async () => {
        await this.requestAccessOnUserInteraction();
      },
      { once: true }
    );
  }

  async requestStorageAccess() {
    if (!isInsideIframe()) return;

    try {
      // Check if API is supported
      if (!document.hasStorageAccess) {
        log(
          LOG_GROUP.STORAGE,
          "Storage Access API not supported, using default localStorage"
        );
        return;
      }

      // Check if we already have access
      const hasAccess = await document.hasStorageAccess();
      if (hasAccess) {
        log(LOG_GROUP.STORAGE, "Already has storage access");
        this.storage = await this.getStorageHandle();
        return;
      }

      // Check permission state
      const permission = await navigator.permissions.query({
        name: "storage-access"
      });

      if (permission.state === "granted") {
        this.storage = await this.getStorageHandle();
        log(LOG_GROUP.STORAGE, "Storage access granted via permission");
      } else if (permission.state === "prompt") {
        log(LOG_GROUP.STORAGE, "Storage access requires user interaction");
        this.setupUserInteractionHandler();
      } else if (permission.state === "denied") {
        log(LOG_GROUP.STORAGE, "Storage access denied by user");
      }
    } catch (error) {
      log(LOG_GROUP.STORAGE, "Error requesting storage access:", error);
    }
  }

  async requestAccessOnUserInteraction() {
    try {
      if (!document.hasStorageAccess) return;

      this.storage = await this.getStorageHandle();
      log(LOG_GROUP.STORAGE, "Storage access granted after user interaction");
    } catch (error) {
      log(
        LOG_GROUP.STORAGE,
        "Error requesting storage access after interaction:",
        error
      );
    }
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
  getItem<T = string>(key: string): T | null {
    const rawValue = this.getRaw(key);
    if (!rawValue) return null;

    try {
      const parsed = JSON.parse(rawValue) as StorageItem<T>;

      // Check if it's a complex storage item
      if (isComplexStorageItem<T>(parsed)) {
        // Check for expiration
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          // Item has expired, remove it
          this.removeItem(key);
          return null;
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
  getItems<T = string>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};

    for (const key of keys) {
      result[key] = this.getItem<T>(key);
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
    expiresIn?: number
  ): void {
    this.setItem(key, value, {
      priority: StorageManager.PRIORITY[priority],
      expiresIn
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
  ensureSpace(
    bytesNeeded: number,
    options: { skipCheck?: boolean; forceEviction?: boolean } = {}
  ): boolean {
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
      aggressive
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
      available: limit - usage.currentSize
    };
  }
}
