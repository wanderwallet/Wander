import { UnpartitionedStorage } from "./unpartitioned-storage";

export class LocalStorage extends UnpartitionedStorage {
  constructor() {
    super({ area: "local" });
  }
}
