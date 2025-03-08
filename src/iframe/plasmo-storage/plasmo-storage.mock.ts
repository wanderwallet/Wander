import { Storage as PlasmoStorage } from "@plasmohq/storage";

export class StorageMock extends PlasmoStorage {
  constructor() {
    super({ area: "session" });

    // This browser doesn't support the Storage Access API
    // so let's just hope we have access!
    if (!document.hasStorageAccess) return;

    // TODO: Can this be postponed until authentication to avoid requesting permissions too soon?
    // this.requestStorageAccess();

    // TODO: We need to abstract localStorage as well to replace the hardcoded `localStorage` calls with the handler ones.

    /*
    TODO: We need a user interaction inside the iframe.

    See https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API/Using, https://github.com/GoogleChrome/related-website-sets

    Note: requestStorageAccess() requests are automatically denied unless the embedded content is currently processing
    a user gesture such as a tap or click (transient activation), or if permission was already granted previously. If
    permission was not previously granted, requestStorageAccess() requests must be run inside a user gesture-based event
    handler, as shown above.
    */
  }

  /*
  async requestStorageAccess() {
    const hasAccess = await document.hasStorageAccess();

    // If we want to modify unpartitioned state, we need to request a handle.
    let handle: {
      localStorage: Storage;
      sessionStorage: Storage;
    } | null = null;

    if (hasAccess) {
      handle = await document.requestStorageAccess({
        localStorage: true,
        sessionStorage: true,
      });
    }

    if (!hasAccess) {
      // Check whether third-party cookie access has been granted
      // to another same-site embed
      try {
        const permission = await navigator.permissions.query({
          name: "storage-access",
        });

        if (permission.state === "granted" || permission.state === "prompt") {
          try {
            // If "granted", you can just call requestStorageAccess() without a user interaction,
            // and it will resolve automatically. If "prompt", this will only work when called after a user interaction:
            handle = await document.requestStorageAccess({
              localStorage: true,
              // TODO: Does localStraoge need to be listed separately?
            });
          } catch (err) {
            // If there is an error obtaining storage access.
            console.error(`Error obtaining storage access: ${err}.`);
          }
        } else if (permission.state === "denied") {
          // User has denied third-party cookie access, so we'll
          // need to do something else
          throw new Error("User denied storage access");
        }
      } catch (error) {
        console.log(`Could not access permission state. Error: ${error}`);
      }
    }

    this.handle = handle.sessionStorage;
  }
  */

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
    return Promise.resolve(JSON.parse(sessionStorage.getItem(key)));
  }

  getItems<T = string>(keys: string[]): Promise<Record<string, T | undefined>> {
    return Promise.resolve(
      keys.reduce((acc, key) => {
        acc[key] = JSON.parse(sessionStorage.getItem(key));

        return acc;
      }, {})
    );
  }

  get: <T = string>(key: string) => Promise<T | undefined> = this.getItem;
  getMany: <T = any>(keys: string[]) => Promise<Record<string, T | undefined>> =
    this.getItems;

  // SET:

  setItem(key: string, rawValue: any): Promise<void> {
    return new Promise((resolve) => {
      sessionStorage.setItem(key, JSON.stringify(rawValue));
      resolve();
    });
  }

  setItems(items: Record<string, any>): Promise<void> {
    return new Promise<void>((resolve) => {
      Object.entries(items).forEach(([key, value]) => {
        sessionStorage.setItem(key, JSON.stringify(value));
      });
      resolve();
    });
  }

  set: (key: string, rawValue: any) => Promise<null> = this.setItem as any;
  setMany: (items: Record<string, any>) => Promise<null> = this.setItems as any;

  // REMOVE  CLEAR

  removeItem(key: string): Promise<void> {
    return new Promise<void>(() => {
      sessionStorage.removeItem(key);
    });
  }

  removeItems(keys: string[]): Promise<void> {
    return new Promise<void>((resolve) => {
      keys.forEach((key) => {
        sessionStorage.removeItem(key);
      });
      resolve();
    });
  }

  remove: (key: string) => Promise<void> = this.removeItem;
  removeMany: (keys: string[]) => Promise<void> = this.removeItems;

  removeAll: () => Promise<void> = () => {
    return new Promise<void>(() => {
      sessionStorage.clear();
    });
  };
}
