import {
  getUnpartitionedStateStatus,
  HAS_SIMPLE_STORAGE_API,
} from "~iframe/storage/unpartitioned-storage/unpartitioned-storage.utils";
import { EnhancedStorage } from "./unpartitioned-storage";

export class LocalStorage extends EnhancedStorage {
  private static instance: LocalStorage | null = null;

  constructor() {
    super({ area: "local" });
  }

  static async getInstance(): Promise<LocalStorage> {
    this.instance = this.instance ?? new LocalStorage();

    await this.instance.requestStorageAccess();

    if (this.instance.storage === localStorage && getUnpartitionedStateStatus() === "supported") {
      if (process.env.NODE_ENV === "development") {
        throw new Error("Using partitioned state in a browser with unpartitioned state support.");
      } else {
        console.warn("Using partitioned state in a browser with unpartitioned state support.");
      }
    }

    return this.instance;
  }
}
