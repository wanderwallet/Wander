import type { PersistedClient, Persister } from "@tanstack/query-persist-client-core";
import { ExtensionStorage } from "~utils/storage";

/**
 * Creates a persister that uses ExtensionStorage for React Query cache persistence
 * @param options Configuration options
 * @param options.cacheKey Unique key to use for storing the cache in ExtensionStorage
 * @returns A persister object that can be used with persistQueryClient
 */
export function createExtensionStoragePersister({ cacheKey }: { cacheKey: string }): Persister {
  return {
    persistClient: async (persistClient: PersistedClient) => {
      try {
        await ExtensionStorage.set(cacheKey, persistClient);
      } catch (error) {
        console.error(`Error persisting query client (${cacheKey}):`, error);
      }
    },
    restoreClient: async () => {
      try {
        const cached = await ExtensionStorage.get<PersistedClient>(cacheKey);
        return cached ? cached : null;
      } catch (error) {
        console.error(`Error restoring query client (${cacheKey}):`, error);
        return null;
      }
    },
    removeClient: async () => {
      try {
        await ExtensionStorage.remove(cacheKey);
      } catch (error) {
        console.error(`Error removing query client (${cacheKey}):`, error);
      }
    },
  };
}
