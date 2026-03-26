export class PromiseQueue<T> {
  private activeCount = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private concurrency: number) {}

  setConcurrency(concurrency: number): void {
    this.concurrency = Math.max(1, Math.floor(concurrency));
    this.flush();
  }

  async add(factory: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.concurrency) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    this.activeCount += 1;

    try {
      return await factory();
    } finally {
      this.activeCount -= 1;
      this.flush();
    }
  }

  private flush(): void {
    while (this.activeCount < this.concurrency) {
      const next = this.queue.shift();
      if (!next) {
        return;
      }
      next();
    }
  }
}
