import { useState, useEffect } from "react";

const checkUnpartitionedState = async (): Promise<boolean> => {
  try {
    const testKey = "partition-test";
    const testValue = "123";

    // 1️⃣ Test Cookie Partitioning
    document.cookie = `${testKey}=${testValue}; SameSite=None; Secure`;
    const cookiesAccessible = document.cookie.includes(testKey);

    // 2️⃣ Test LocalStorage Partitioning
    localStorage.setItem(testKey, testValue);
    const localStorageAccessible = localStorage.getItem(testKey) === testValue;
    localStorage.removeItem(testKey);

    // 3️⃣ Test IndexedDB Partitioning
    let indexedDBAccessible = false;
    const dbRequest = indexedDB.open(testKey);
    dbRequest.onsuccess = () => {
      indexedDBAccessible = true;
      indexedDB.deleteDatabase(testKey);
    };

    // 4️⃣ Test Cache Storage Partitioning
    const cacheName = "partition-test-cache";
    const cache = await caches.open(cacheName);
    await cache.put("/", new Response("test"));
    const cacheAccessible = (await cache.match("/")) !== undefined;
    await caches.delete(cacheName);

    // Return true if any method shows unpartitioned state
    return (
      cookiesAccessible ||
      localStorageAccessible ||
      indexedDBAccessible ||
      cacheAccessible
    );
  } catch (error) {
    return false;
  }
};

export const useUnpartitionedStateCheck = () => {
  const [hasUnpartitionedState, setHasUnpartitionedState] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    checkUnpartitionedState().then(setHasUnpartitionedState);
  }, []);

  return hasUnpartitionedState;
};
