import { EnhancedStorage } from "./unpartitioned-storage";

export class LocalStorage extends EnhancedStorage {
  private static instance: LocalStorage | null = null;

  constructor() {
    super({ area: "local" });
  }

  static async getInstance(): Promise<LocalStorage> {
    if (!this.instance) {
      this.instance = new LocalStorage();
      await this.instance.requestStorageAccess();
    }
    return this.instance;
  }
}
