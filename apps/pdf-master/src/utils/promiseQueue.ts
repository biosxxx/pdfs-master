export class PromiseQueue<T> {
  private activeCount = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly concurrency: number) {}

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
      this.queue.shift()?.();
    }
  }
}
