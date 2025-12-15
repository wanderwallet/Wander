export class ObservableMap<K, V> {
  private map = new Map<K, V>();
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) {
      try {
        fn();
      } catch {}
    }
  }

  set(key: K, value: V) {
    this.map.set(key, value);
    this.notify();
    return this;
  }

  setAll(entries: [K, V][]) {
    this.map.clear();
    for (const [key, value] of entries) {
      this.map.set(key, value);
    }
    this.notify();
    return this;
  }

  delete(key: K) {
    const result = this.map.delete(key);
    if (result) this.notify();
    return result;
  }

  clear() {
    if (this.map.size === 0) return;
    this.map.clear();
    this.notify();
  }

  // read methods
  get(key: K) {
    return this.map.get(key);
  }
  has(key: K) {
    return this.map.has(key);
  }
  entries() {
    return this.map.entries();
  }
  values() {
    return this.map.values();
  }
  keys() {
    return this.map.keys();
  }
  size() {
    return this.map.size;
  }
}
