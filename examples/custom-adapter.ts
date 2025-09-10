import { WebhookQueue } from "../mod.ts";
import type { BaseAdapter } from "../src/types.ts";

class LoggingAdapter implements BaseAdapter {
  private data: Map<string, string> = new Map();

  get(key: string): Promise<string | null> {
    const value = this.data.get(key) ?? null;
    console.log(`GET: ${key} -> ${value ? 'found' : 'not found'}`);
    return Promise.resolve(value);
  }

  set(key: string, data: string): Promise<void> {
    console.log(`SET: ${key} -> ${data.length} chars`);
    this.data.set(key, data);
    return Promise.resolve();
  }
}

class DatabaseAdapter implements BaseAdapter {
  get(key: string): Promise<string | null> {
    // const result = await this.db.query("SELECT data FROM storage WHERE key = ?", [key]);
    // return result.length > 0 ? result[0].data : null;
    return Promise.resolve(null);
  }

  set(key: string, data: string): Promise<void> {
    // await this.db.execute("INSERT OR REPLACE INTO storage (key, data) VALUES (?, ?)", [key, data]);
    return Promise.resolve();
  }
}

class RedisAdapter implements BaseAdapter {
  get(key: string): Promise<string | null> {
    // return await this.redis.get(key);
    return Promise.resolve(null);
  }

  set(key: string, data: string): Promise<void> {
    // await this.redis.set(key, data);
    return Promise.resolve();
  }
}

const webhookUrl = "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN";

console.log("Custom Adapter Examples");

const loggingAdapter = new LoggingAdapter();
const _queue1 = new WebhookQueue(webhookUrl, { adapter: loggingAdapter });

const databaseAdapter = new DatabaseAdapter();
const _queue2 = new WebhookQueue(webhookUrl, { adapter: databaseAdapter });

const redisAdapter = new RedisAdapter();
const _queue3 = new WebhookQueue(webhookUrl, { adapter: redisAdapter });

const testMessages = [
  { content: "Test message 1", username: "Custom Bot" },
  { content: "Test message 2", embeds: [{ title: "Custom Adapter Test", color: 0xff6600 }] },
];

console.log("Logging adapter demo:");
// Uncomment to test: await _queue1.enqueue(testMessages[0]);

console.log("Database and Redis adapters ready for implementation.");