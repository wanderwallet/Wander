import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  vi,
  afterEach,
  afterAll
} from "vitest";
import { EnhancedStorage, StorageManager } from "./unpartitioned-storage";
import { StorageMock } from "../plasmo-storage/plasmo-storage.mock";

// Set global test timeout
vi.setConfig({ testTimeout: 20000 });

// Mock the modules directly instead of using path aliases
vi.mock("~utils/embedded/iframe.utils", () => ({
  isInsideIframe: vi.fn().mockReturnValue(true),
  ancestorOrigin: vi.fn().mockReturnValue("https://test.com"),
  searchParams: new URLSearchParams({
    PARAM_CLIENT_ID: "test-client-id"
  })
}));

vi.mock("~utils/log/log.utils", () => ({
  log: vi.fn(),
  LOG_GROUP: {
    STORAGE: "storage"
  }
}));

// Setup global browser objects that might not be in JSDOM
beforeAll(() => {
  // Ensure document.hasStorageAccess exists
  if (!document.hasStorageAccess) {
    document.hasStorageAccess = vi.fn().mockResolvedValue(false);
  }

  // Ensure document.requestStorageAccess exists
  if (!document.requestStorageAccess) {
    document.requestStorageAccess = vi.fn().mockResolvedValue(undefined);
  }

  // Ensure navigator.permissions exists
  if (!navigator.permissions) {
    Object.defineProperty(navigator, "permissions", {
      value: {
        query: vi.fn().mockResolvedValue({ state: "prompt" })
      },
      configurable: true
    });
  } else if (!navigator.permissions.query) {
    navigator.permissions.query = vi
      .fn()
      .mockResolvedValue({ state: "prompt" });
  }
});

describe("EnhancedStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test("should initialize with localStorage by default", () => {
    const storage = new EnhancedStorage();
    expect(storage["storageType"]).toBe("localStorage");
  });

  test("should initialize with sessionStorage when specified", () => {
    const storage = new EnhancedStorage({ area: "session" });
    expect(storage["storageType"]).toBe("sessionStorage");
  });

  test("should store and retrieve simple items", () => {
    const storage = new EnhancedStorage();
    const key = "testKey";
    const value = "testValue";

    storage.setItem(key, value);
    const retrieved = storage.getItem(key);

    expect(retrieved).toBe(value);
    expect(JSON.parse(localStorage.getItem(key))).toBe(value);
  });

  test("should store and retrieve complex items with expiration", () => {
    const storage = new EnhancedStorage();
    const key = "testKey";
    const value = { name: "test" };
    const options = { expiresIn: 3600000 }; // 1 hour

    storage.setItem(key, value, options);

    // Get the stored value directly from localStorage
    const storedValue = JSON.parse(localStorage.getItem(key));
    expect(storedValue.value).toEqual(value);
    expect(storedValue.expiresAt).toBeDefined();

    const retrieved = storage.getItem(key);
    expect(retrieved).toEqual(value);
  });

  test("should handle expired items", () => {
    const storage = new EnhancedStorage();
    const key = "testKey";

    // Store an expired item directly
    localStorage.setItem(
      key,
      JSON.stringify({
        value: "expired value",
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      })
    );

    const retrieved = storage.getItem(key);
    expect(retrieved).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });

  test("should handle items with priority", () => {
    const storage = new EnhancedStorage();
    const key = "priorityKey";
    const value = "important value";

    storage.setPrioritizedItem(key, value, "HIGH");

    const storedValue = JSON.parse(localStorage.getItem(key));
    expect(storedValue.priority).toBe(8);
    expect(storedValue.value).toBe(value);
  });

  test("should get raw value without parsing", () => {
    const storage = new EnhancedStorage();
    const key = "rawKey";
    const rawValue = '{"not": "valid json';

    localStorage.setItem(key, rawValue);
    const result = storage.getRaw(key);
    expect(result).toBe(rawValue);
  });

  test("should set raw value without processing", () => {
    const storage = new EnhancedStorage();
    const key = "rawKey";
    const rawValue = '{"not": "valid json';

    storage.setRaw(key, rawValue);
    expect(localStorage.getItem(key)).toBe(rawValue);
  });
});

describe("StorageManager", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    StorageManager["lastCleanupTime"] = 0;
  });

  describe("Storage usage calculation", () => {
    test("should calculate storage usage correctly", () => {
      // Set up test data directly in sessionStorage
      const testData = {
        key1: "value1",
        key2: '{"complex":"value"}'
      };

      Object.entries(testData).forEach(([key, value]) => {
        sessionStorage.setItem(key, value);
      });

      const usage = StorageManager.calculateStorageUsage(sessionStorage);

      expect(usage.currentSize).toBe(
        StorageManager.calculateStorageUsageByKeys(sessionStorage, [
          "key1",
          "key2"
        ])
      );
      expect(usage.itemCount).toBe(2);
    });
  });

  describe("Item eviction", () => {
    test("should clear expired items", () => {
      // Set up test data with expired and non-expired items
      sessionStorage.setItem(
        "item1",
        JSON.stringify({
          value: "test1",
          expiresAt: Date.now() - 1000 // expired
        })
      );
      sessionStorage.setItem(
        "item2",
        JSON.stringify({
          value: "test2",
          expiresAt: Date.now() + 10000 // not expired
        })
      );
      sessionStorage.setItem(
        "item3",
        JSON.stringify({ simple: "value" }) // no expiration
      );

      const clearedCount = StorageManager.clearExpiredItems(
        sessionStorage,
        true
      );

      expect(clearedCount).toBe(1);
      expect(sessionStorage.getItem("item1")).toBeNull();
      expect(sessionStorage.getItem("item2")).not.toBeNull();
      expect(sessionStorage.getItem("item3")).not.toBeNull();
    });

    test("should assign CRITICAL priority to simple items by default", () => {
      // Store a simple item
      sessionStorage.setItem("simpleItem", JSON.stringify("simple value"));

      // Store a non-JSON item
      sessionStorage.setItem("nonJsonItem", "invalid-json");

      // Get sorted items
      const items = StorageManager.getSortedStorageItems(sessionStorage);

      // Find our test items
      const simpleItem = items.find((item) => item.key === "simpleItem");
      const nonJsonItem = items.find((item) => item.key === "nonJsonItem");

      // Verify priorities
      expect(simpleItem.priority).toBe(StorageManager.PRIORITY_LEVELS.CRITICAL);
      expect(nonJsonItem.priority).toBe(
        StorageManager.PRIORITY_LEVELS.CRITICAL
      );
    });
  });
});

describe("StorageMock", () => {
  let storageMock: StorageMock;

  beforeEach(() => {
    sessionStorage.clear();
    storageMock = new StorageMock();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  test("should initialize with sessionStorage", () => {
    expect(storageMock["storage"]["storageType"]).toBe("sessionStorage");
  });

  test("should set and get items properly", async () => {
    await storageMock.setItem("testKey", "testValue");

    // Verify the raw storage state
    const rawStored = sessionStorage.getItem("testKey");
    expect(rawStored).toBe(JSON.stringify("testValue"));

    // Verify through the API
    const result = await storageMock.getItem("testKey");
    expect(result).toBe("testValue");
  });

  test("should handle complex objects", async () => {
    const complexObject = { test: "value", nested: { prop: 123 } };
    await storageMock.setItem("complex", complexObject);

    // Verify the raw storage state
    const rawStored = JSON.parse(sessionStorage.getItem("complex"));
    expect(rawStored).toEqual(complexObject);

    // Verify through the API
    const result = await storageMock.getItem("complex");
    expect(result).toEqual(complexObject);
  });

  test("should remove items properly", async () => {
    // First verify we can set an item
    await storageMock.setItem("toRemove", "value");
    const initialValue = sessionStorage.getItem("toRemove");
    expect(initialValue).not.toBeNull();
    expect(JSON.parse(initialValue)).toBe("value");

    // Then remove it
    await storageMock.removeItem("toRemove");

    // Verify it's gone from both the API and storage
    const result = await storageMock.getItem("toRemove");
    expect(result).toBeUndefined();
    expect(sessionStorage.getItem("toRemove")).toBeNull();
  });

  test("should handle batch operations", async () => {
    const items = {
      key1: "value1",
      key2: "value2",
      key3: { complex: true }
    };

    await storageMock.setItems(items);

    // Verify all items were stored correctly
    Object.entries(items).forEach(([key, value]) => {
      const stored = JSON.parse(sessionStorage.getItem(key));
      expect(stored).toEqual(value);
    });

    const results = await storageMock.getItems(Object.keys(items));
    expect(results).toEqual(items);

    await storageMock.removeItems(["key1", "key2"]);

    // Verify removal
    expect(sessionStorage.getItem("key1")).toBeNull();
    expect(sessionStorage.getItem("key2")).toBeNull();
    expect(sessionStorage.getItem("key3")).not.toBeNull();
  });

  test("should prioritize items correctly", async () => {
    await storageMock.setCritical("critical", "criticalValue");
    await storageMock.setPreference("preference", "prefValue");
    await storageMock.setCache("cache", "cacheValue");
    await storageMock.setTemporary("temp", "tempValue");

    // Verify items are stored with correct priorities
    const criticalItem = JSON.parse(sessionStorage.getItem("critical"));
    const preferenceItem = JSON.parse(sessionStorage.getItem("preference"));
    const cacheItem = JSON.parse(sessionStorage.getItem("cache"));
    const tempItem = JSON.parse(sessionStorage.getItem("temp"));

    expect(criticalItem.priority).toBe(10);
    expect(preferenceItem.priority).toBe(8);
    expect(cacheItem.priority).toBe(3);
    expect(tempItem.priority).toBe(1);

    const info = storageMock.getUsageInfo();
    expect(info.items).toBe(4);
  });
});

describe("Storage Eviction", () => {
  let storage: EnhancedStorage;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    storage = new EnhancedStorage();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  test("should respect browser storage limits", async () => {
    const smallData = "x".repeat(1024); // 1KB
    let storageError = false;

    try {
      // Try to store data until we hit the browser limit
      for (let i = 0; i < 10000 && !storageError; i++) {
        try {
          storage.setItem(`test${i}`, smallData);
        } catch (e) {
          if (e.name === "QuotaExceededError") {
            storageError = true;
          }
        }
      }
    } catch (e) {
      // Catch any quota exceeded errors
      storageError = true;
    }

    const usage = storage.getUsageInfo();
    expect(usage.bytes).toBeLessThanOrEqual(StorageManager.MAX_STORAGE_SIZE);
  });

  test("should handle eviction with realistic data sizes", async () => {
    // Use smaller chunks for testing
    const chunk = "x".repeat(1024); // 1KB chunks
    const items = [
      { key: "critical", size: 2, priority: "CRITICAL" }, // 2KB
      { key: "high", size: 3, priority: "HIGH" }, // 3KB
      { key: "medium", size: 5, priority: "MEDIUM" }, // 5KB
      { key: "low", size: 10, priority: "LOW" }, // 10KB
      { key: "temp", size: 20, priority: "TEMPORARY" } // 20KB
    ];

    // Store items
    for (const item of items) {
      storage.setPrioritizedItem(
        item.key,
        chunk.repeat(item.size),
        item.priority as keyof typeof StorageManager.PRIORITY_LEVELS
      );
    }

    // Request space for new data
    storage.ensureSpace(15 * 1024); // Try to ensure 15KB space

    // Verify eviction behavior
    const remaining = items.filter(
      (item) => storage.getItem(item.key) !== null
    );

    // Higher priority items should remain
    expect(storage.getItem("critical")).not.toBeNull();
    expect(storage.getItem("high")).not.toBeNull();

    // Lower priority items might be evicted
    const usage = storage.getUsageInfo();
    expect(usage.bytes).toBeLessThanOrEqual(StorageManager.MAX_STORAGE_SIZE);
  });

  test("should handle quota exceeded errors gracefully", async () => {
    const largeData = "x".repeat(10 * 1024); // 10KB chunks
    let errorThrown = false;

    try {
      // Try to store more than our test limit
      for (let i = 0; i < 15; i++) {
        storage.ensureSpace(10 * 1024);
        storage.setItem(`large${i}`, largeData);
      }
    } catch (e) {
      errorThrown = e.name === "QuotaExceededError";
    }

    const usage = storage.getUsageInfo();
    expect(usage.bytes).toBeLessThanOrEqual(StorageManager.MAX_STORAGE_SIZE);
    expect(usage.percentage).toBeLessThanOrEqual(100);
  });

  test("should evict items to maintain buffer space", async () => {
    // Fill storage with enough data to trigger eviction
    const chunk = "x".repeat(1024); // 1KB

    // Add some initial data
    for (let i = 0; i < 10; i++) {
      storage.setPrioritizedItem(`data${i}`, chunk.repeat(100), "LOW"); // 100KB each
    }

    // Force eviction by requesting space
    storage.ensureSpace(2048, { forceEviction: true });

    // Add new item
    storage.setPrioritizedItem("newItem", chunk.repeat(2), "MEDIUM");

    const usage = storage.getUsageInfo();
    expect(usage.available).toBeGreaterThan(0);
  });

  test("should evict expired items first", async () => {
    const now = Date.now();

    // Set items with explicit expiration timestamps
    storage.setItem("expired1", "value1", {
      expiresIn: -1000 // Expired 1 second ago
    });
    storage.setItem("expired2", "value2", {
      expiresIn: -2000 // Expired 2 seconds ago
    });
    storage.setItem("valid", "value3", {
      expiresIn: 10000 // Valid for 10 more seconds
    });

    // Force eviction
    storage.evictIfNeeded(1000, true);

    // Check through storage API instead of direct localStorage access
    expect(storage.getItem("expired1")).toBeNull();
    expect(storage.getItem("expired2")).toBeNull();
    expect(storage.getItem("valid")).not.toBeNull();
  });

  test("should evict items based on priority", async () => {
    // Fill storage with medium priority data (1MB chunks)
    const chunk = "x".repeat(1024 * 1024); // 1MB

    // Add 3MB of medium priority data
    for (let i = 0; i < 3; i++) {
      storage.setPrioritizedItem(`medium${i}`, chunk, "MEDIUM");
    }

    // Add test items with different priorities
    storage.setPrioritizedItem("critical", "criticalValue", "CRITICAL");
    storage.setPrioritizedItem("high", "highValue", "HIGH");
    storage.setPrioritizedItem("low", "lowValue", "LOW");
    storage.setPrioritizedItem("temporary", "tempValue", "TEMPORARY");

    // Force eviction by requesting 2MB
    storage.evictIfNeeded(2 * 1024 * 1024, true);

    // Verify priorities were respected
    expect(storage.getItem("temporary")).toBeNull();
    expect(storage.getItem("low")).toBeNull();
    expect(storage.getItem("critical")).toBe("criticalValue");
    expect(storage.getItem("high")).toBe("highValue");
  });

  test("should handle ensureSpace with different strategies", async () => {
    // Fill storage with items
    storage.setPrioritizedItem("temp1", "x".repeat(1000), "TEMPORARY");
    storage.setPrioritizedItem("temp2", "x".repeat(1000), "TEMPORARY");
    storage.setPrioritizedItem("critical", "important", "CRITICAL");

    // Try to ensure space with default strategy
    const result1 = storage.ensureSpace(500);
    expect(result1).toBe(true);

    // Try with force eviction
    const result2 = storage.ensureSpace(500, { forceEviction: true });
    expect(result2).toBe(true);

    // Critical data should still be present
    expect(JSON.parse(localStorage.getItem("critical"))).toBeDefined();
  });

  test("should respect storage limits", async () => {
    const mediumData = "x".repeat(10 * 1024); // 10KB chunks
    let stored = 0;

    // Try to store data until we hit a limit
    try {
      for (let i = 0; stored < StorageManager.MAX_STORAGE_SIZE; i++) {
        storage.ensureSpace(10 * 1024);
        storage.setPrioritizedItem(`data${i}`, mediumData, "LOW");
        stored += 10 * 1024;
      }
    } catch (e) {
      // Expected to eventually throw
    }

    const usage = storage.getUsageInfo();
    expect(usage.bytes).toBeLessThanOrEqual(StorageManager.MAX_STORAGE_SIZE);
  });

  test("should maintain priority order during eviction", async () => {
    // Set up items with various priorities
    const items = [
      { key: "critical1", priority: "CRITICAL", value: "value1" },
      { key: "high1", priority: "HIGH", value: "value2" },
      { key: "medium1", priority: "MEDIUM", value: "value3" },
      { key: "low1", priority: "LOW", value: "value4" },
      { key: "temp1", priority: "TEMPORARY", value: "value5" }
    ];

    // Store all items
    items.forEach((item) => {
      storage.setPrioritizedItem(item.key, item.value, item.priority as any);
    });

    // Force aggressive eviction
    storage.evictIfNeeded(2000, true);

    // Verify eviction order
    const remaining = items.filter(
      (item) => localStorage.getItem(item.key) !== null
    );

    // Check that remaining items are in priority order
    remaining.forEach((item, index) => {
      if (index > 0) {
        const prevPriority = StorageManager.PRIORITY[items[index - 1].priority];
        const currentPriority = StorageManager.PRIORITY[item.priority];
        expect(currentPriority).toBeLessThanOrEqual(prevPriority);
      }
    });
  });

  test("should handle concurrent eviction requests", async () => {
    // Set up initial data
    storage.setPrioritizedItem("item1", "x".repeat(1000), "LOW");
    storage.setPrioritizedItem("item2", "x".repeat(1000), "LOW");

    // Trigger multiple eviction requests concurrently
    const results = await Promise.all([
      storage.evictIfNeeded(500),
      storage.evictIfNeeded(500),
      storage.evictIfNeeded(500)
    ]);

    // All requests should complete successfully
    expect(results.every((result) => result === true)).toBe(true);
  });

  test("should calculate correct storage usage after eviction", async () => {
    // Store enough data to trigger eviction
    const testData = "x".repeat(10000);
    for (let i = 0; i < 450; i++) {
      storage.setItem(`test${i}`, testData, { priority: 1 });
    }

    const beforeUsage = storage.getUsageInfo();

    // Force aggressive eviction 1MB
    storage.evictIfNeeded(1024 * 1024, true);

    const afterUsage = storage.getUsageInfo();

    expect(afterUsage.bytes).toBeLessThan(beforeUsage.bytes);
    expect(afterUsage.items).toBeLessThan(beforeUsage.items);
  });
});
