export class LruMap<K, V> {
  private readonly map = new Map<K, V>();

  constructor(
    private readonly maxEntries: number,
    private readonly onEvict?: (key: K, value: V) => void,
  ) {}

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (!value) {
      return undefined;
    }

    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);

    while (this.map.size > this.maxEntries) {
      const oldest = this.map.entries().next().value as [K, V] | undefined;
      if (!oldest) {
        break;
      }
      this.map.delete(oldest[0]);
      this.onEvict?.(oldest[0], oldest[1]);
    }
  }

  delete(key: K): void {
    const value = this.map.get(key);
    if (value) {
      this.map.delete(key);
      this.onEvict?.(key, value);
    }
  }

  clear(): void {
    for (const [key, value] of this.map.entries()) {
      this.onEvict?.(key, value);
    }
    this.map.clear();
  }
}
