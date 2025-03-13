import { log, LOG_GROUP } from "~utils/log/log.utils";

export class LocalStorage implements Storage {
  private storage: Storage = globalThis.localStorage;

  async requestStorageAccess(): Promise<boolean> {
    try {
      // Check if API is supported
      if (!document.hasStorageAccess) {
        log(
          LOG_GROUP.STORAGE,
          "Storage Access API not supported, using default localStorage"
        );
        return true;
      }

      // Check if we already have access
      const hasAccess = await document.hasStorageAccess();
      if (hasAccess) {
        log(LOG_GROUP.STORAGE, "Already has storage access");
        try {
          // @ts-expect-error - requestStorageAccess should return a handle
          const handle = (await document.requestStorageAccess({
            localStorage: true
          })) as { localStorage: Storage };

          this.storage = handle.localStorage;
          return true;
        } catch (error) {
          // API might not support handle yet, continue with regular localStorage
          log(
            LOG_GROUP.STORAGE,
            "Storage access granted but couldn't get handle:",
            error
          );
          return true;
        }
      }

      // Check permission state
      try {
        const permission = await navigator.permissions.query({
          name: "storage-access"
        });

        if (permission.state === "granted") {
          // If permission granted, call requestStorageAccess without user interaction
          // @ts-expect-error - requestStorageAccess should return a handle
          const handle = (await document.requestStorageAccess({
            localStorage: true
          })) as { localStorage: Storage };

          this.storage = handle.localStorage;
          log(LOG_GROUP.STORAGE, "Storage access granted via permission");
          return true;
        } else if (permission.state === "prompt") {
          log(LOG_GROUP.STORAGE, "Storage access requires user interaction");
          // Will need to be called after user interaction
          return false;
        } else if (permission.state === "denied") {
          log(LOG_GROUP.STORAGE, "Storage access denied by user");
          return false;
        }
      } catch (error) {
        // Some browsers don't support permissions query for storage-access
        log(LOG_GROUP.STORAGE, "Couldn't query permission:", error);
      }

      return false;
    } catch (error) {
      log(LOG_GROUP.STORAGE, "Error requesting storage access:", error);
      return false;
    }
  }

  async requestAccessOnUserInteraction(): Promise<boolean> {
    try {
      if (!document.hasStorageAccess) return true;

      // @ts-expect-error - requestStorageAccess should return a handle
      const handle = (await document.requestStorageAccess({
        localStorage: true
      })) as { localStorage: Storage };

      this.storage = handle.localStorage;

      log(LOG_GROUP.STORAGE, "Storage access granted after user interaction");
      return true;
    } catch (error) {
      log(
        LOG_GROUP.STORAGE,
        "Error requesting storage access after interaction:",
        error
      );
      return false;
    }
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }

  key(index: number): string | null {
    return this.storage.key(index);
  }

  get length(): number {
    return this.storage.length;
  }
}
