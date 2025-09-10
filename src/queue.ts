import { DiscordWebhook } from "./webhook.ts";
import type { BaseAdapter, QueueItem, QueueOptions, WebhookMessage } from "./types.ts";

interface PendingItem {
  item: QueueItem;
  resolve: (value: Response) => void;
  reject: (reason: Error) => void;
}

class MemoryAdapter implements BaseAdapter {
  private data: Map<string, string> = new Map();

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.data.get(key) ?? null);
  }

  set(key: string, data: string): Promise<void> {
    this.data.set(key, data);
    return Promise.resolve();
  }
}

export class WebhookQueue {
  private webhook: DiscordWebhook;
  private adapter: BaseAdapter;
  private processing = false;
  private pendingItems: Map<string, PendingItem> = new Map();
  private static readonly QUEUE_KEY = "webhook_queue";

  constructor(webhookUrl: string, options: QueueOptions = {}) {
    this.webhook = new DiscordWebhook(webhookUrl);
    this.adapter = options.adapter ?? new MemoryAdapter();
    this.loadExistingItems();
  }

  async enqueue(message: WebhookMessage): Promise<Response> {
    const item: QueueItem = {
      id: crypto.randomUUID(),
      message,
      createdAt: new Date(),
    };

    const promise = new Promise<Response>((resolve, reject) => {
      this.pendingItems.set(item.id, { item, resolve, reject });
    });

    await this.saveQueueData();

    if (!this.processing) {
      this.processQueue();
    }

    return promise;
  }

  private async loadExistingItems(): Promise<void> {
    const data = await this.adapter.get(WebhookQueue.QUEUE_KEY);
    if (!data) return;

    try {
      const items: QueueItem[] = JSON.parse(data).map((item: { id: string; message: WebhookMessage; createdAt: string }) => ({
        id: item.id,
        message: item.message,
        createdAt: new Date(item.createdAt),
      }));

      for (const item of items) {
        this.pendingItems.set(item.id, {
          item,
          resolve: () => {},
          reject: () => {},
        });
      }

      if (items.length > 0 && !this.processing) {
        this.processQueue();
      }
    } catch (error) {
      console.error("Failed to load queue data:", error);
    }
  }

  private async saveQueueData(): Promise<void> {
    const items = Array.from(this.pendingItems.values())
      .map(pending => ({
        id: pending.item.id,
        message: pending.item.message,
        createdAt: pending.item.createdAt.toISOString(),
      }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    await this.adapter.set(WebhookQueue.QUEUE_KEY, JSON.stringify(items));
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.pendingItems.size > 0) {
      const pendingArray = Array.from(this.pendingItems.values());
      if (pendingArray.length === 0) break;

      const oldestPending = pendingArray.sort((a, b) => 
        a.item.createdAt.getTime() - b.item.createdAt.getTime()
      )[0];

      try {
        const response = await this.webhook.send(oldestPending.item.message);
        this.pendingItems.delete(oldestPending.item.id);
        await this.saveQueueData();
        oldestPending.resolve(response);
      } catch (error) {
        if (error instanceof Error && error.message.includes('429')) {
          await this.delay(500);
          continue;
        } else {
          this.pendingItems.delete(oldestPending.item.id);
          await this.saveQueueData();
          oldestPending.reject(error as Error);
        }
      }

      await this.delay(500);
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  get queueLength(): number {
    return this.pendingItems.size;
  }

  get isProcessing(): boolean {
    return this.processing;
  }

  async clear(): Promise<void> {
    this.pendingItems.clear();
    await this.adapter.set(WebhookQueue.QUEUE_KEY, JSON.stringify([]));
  }
}
