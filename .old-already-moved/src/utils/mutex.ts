export class Mutex {
  private mutex = Promise.resolve();

  lock(): Promise<() => void> {
    let unlockNext: () => void;
    const willLock = new Promise<void>((resolve) => (unlockNext = resolve));
    // To release the lock
    const unlock = () => unlockNext();

    const currentLock = this.mutex.then(() => unlock);
    this.mutex = this.mutex.then(() => willLock);
    return currentLock;
  }
}
