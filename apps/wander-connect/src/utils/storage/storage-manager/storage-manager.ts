import { isComplexStorageItem } from "~iframe/storage/storage-manager/storage-manager.utils";

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
    TEMPORARY: 1, // Short-lived or disposable data
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
    options: { bufferSize?: number; aggressive?: boolean } = {},
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
    const evictionThreshold = aggressive ? this.PRIORITY_LEVELS.HIGH : this.PRIORITY_LEVELS.CRITICAL;

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

        if (isComplexStorageItem(parsed, { expiresAt: true }) && parsed.expiresAt < now) {
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
    return keys.reduce((acc, key) => acc + this.calculateStorageUsageByKey(storage, key), 0);
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
            expiresAt: parsed.expiresAt ?? Number.MAX_SAFE_INTEGER,
          });
        } else {
          // Simple items get default priority
          items.push({
            key,
            size,
            priority: this.DEFAULT_PRIORITY,
            expiresAt: Number.MAX_SAFE_INTEGER,
          });
        }
      } catch (e) {
        // Non-JSON items get lowest priority
        items.push({
          key,
          size,
          priority: this.DEFAULT_PRIORITY,
          expiresAt: Number.MAX_SAFE_INTEGER,
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
      items: usage.itemCount,
    };
  }
}
