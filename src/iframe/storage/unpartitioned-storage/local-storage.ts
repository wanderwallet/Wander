import { getUnpartitionedStateStatus } from "~iframe/storage/unpartitioned-storage/unpartitioned-storage.utils";
import { EnhancedStorage } from "./unpartitioned-storage";
import { isInsideIframe } from "~utils/embedded/iframe.utils";

export class LocalStorage extends EnhancedStorage {
  private static instance: LocalStorage | null = null;

  constructor() {
    super({ area: "local" });
  }

  static async getInstance(): Promise<LocalStorage> {
    this.instance = this.instance ?? new LocalStorage();

    await this.instance.requestStorageAccess();

    if (this.instance.storage === localStorage && getUnpartitionedStateStatus() === "supported" && isInsideIframe()) {
      if (process.env.NODE_ENV === "development") {
        throw new Error("Using partitioned state in a browser with unpartitioned state support.");
      } else {
        console.warn("Using partitioned state in a browser with unpartitioned state support.");
      }
    }

    return this.instance;
  }

  // TODO: This is not the most elegant solution for the use case in `StorageMock` (`plasmo-storage.mock.ts`). Refactor this later:

  static getInstanceWithoutWaiting(): LocalStorage {
    this.instance = this.instance ?? new LocalStorage();

    this.instance.requestStorageAccess().then(() => {
      if (this.instance.storage === localStorage && getUnpartitionedStateStatus() === "supported" && isInsideIframe()) {
        if (process.env.NODE_ENV === "development") {
          throw new Error("Using partitioned state in a browser with unpartitioned state support.");
        } else {
          console.warn("Using partitioned state in a browser with unpartitioned state support.");
        }
      }
    });

    return this.instance;
  }
}
