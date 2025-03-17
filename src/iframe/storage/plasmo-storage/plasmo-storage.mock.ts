import { Storage as PlasmoStorage } from "@plasmohq/storage";
import { UnpartitionedStorage } from "../unpartitioned-storage/unpartitioned-storage";

export class StorageMock extends PlasmoStorage {
  private storage: UnpartitionedStorage;

  constructor() {
    super({ area: "session" });
    this.storage = new UnpartitionedStorage({ area: "session" });

    // This browser doesn't support the Storage Access API
    // so let's just hope we have access!
    if (!document.hasStorageAccess) return;

    // TODO: Can this be postponed until authentication to avoid requesting permissions too soon?
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
    return Promise.resolve(JSON.parse(this.storage.getItem(key)));
  }

  getItems<T = string>(keys: string[]): Promise<Record<string, T | undefined>> {
    return Promise.resolve(
      keys.reduce((acc, key) => {
        acc[key] = JSON.parse(this.storage.getItem(key));

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
      this.storage.setItem(key, JSON.stringify(rawValue));
      resolve();
    });
  }

  setItems(items: Record<string, any>): Promise<void> {
    return new Promise<void>((resolve) => {
      Object.entries(items).forEach(([key, value]) => {
        this.storage.setItem(key, JSON.stringify(value));
      });
      resolve();
    });
  }

  set: (key: string, rawValue: any) => Promise<null> = this.setItem as any;
  setMany: (items: Record<string, any>) => Promise<null> = this.setItems as any;

  // REMOVE  CLEAR

  removeItem(key: string): Promise<void> {
    return new Promise<void>(() => {
      this.storage.removeItem(key);
    });
  }

  removeItems(keys: string[]): Promise<void> {
    return new Promise<void>((resolve) => {
      keys.forEach((key) => {
        this.storage.removeItem(key);
      });
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

  // unpartitioned storage:
  async requestStorageAccess() {
    await this.storage.requestStorageAccess();
  }

  async requestAccessOnUserInteraction() {
    await this.storage.requestAccessOnUserInteraction();
  }
}
