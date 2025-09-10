# Discord Webhook Queue

A TypeScript library focused on handling Discord 429 rate limits through sequential message processing with pluggable persistence.

## Philosophy

This library is designed with a specific goal: **handle Discord 429 rate limits by processing messages sequentially until they succeed (429 → 204)**. It uses a simple approach:

- Process messages one by one with 500ms intervals
- Persist messages so they survive application restarts
- Continue processing until all messages are successfully sent
- No complex retry logic or rate limiting - just persistent sequential processing

## Features

- ✅ **429-focused**: Specifically designed to handle Discord rate limits
- ✅ **Sequential processing**: One message at a time with 500ms intervals
- ✅ **Pluggable persistence**: Choose how to store your queue (memory, file, database)
- ✅ **Crash recovery**: Messages survive application restarts
- ✅ **TypeScript support**: Full type definitions included
- ✅ **Cross-platform**: Works with both Deno and Node.js
- ✅ **Zero runtime dependencies**: Uses built-in APIs (node:fs for file operations)
- ✅ **JSR compatible**: Easy installation and distribution

## Installation

### Deno (JSR)

```bash
deno add jsr:@evex/discord-webhook-queue
```

### Node.js (npm)

```bash
npm install @evex/discord-webhook-queue

# If using TypeScript, you may also need:
npm install --save-dev @types/node
```

### URL imports (Deno)

```typescript
import { WebhookQueue } from "jsr:@evex/discord-webhook-queue";
```

## Quick Start

```typescript
import { WebhookQueue } from "@evex/discord-webhook-queue";

const webhookUrl = "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN";
const queue = new WebhookQueue(webhookUrl);

// Messages are automatically persisted and processed sequentially
await queue.enqueue({
  content: "This message will be sent even if the app restarts!"
});
```

## Base Adapters

The queue supports different storage backends through simple base adapters. We provide two built-in adapters, and you can easily create custom ones:

### Memory Adapter (Default)

```typescript
import { WebhookQueue } from "@evex/discord-webhook-queue";

// Uses in-memory storage (lost on restart)
const queue = new WebhookQueue(webhookUrl);
```

### File Adapter

```typescript
import { WebhookQueue, FileAdapter } from "@evex/discord-webhook-queue";

const adapter = new FileAdapter("./my-queue.json");
const queue = new WebhookQueue(webhookUrl, { adapter });
```

**Deno permissions required:**
```bash
deno run --allow-read --allow-write your-script.ts
```

**Node.js:** No special permissions required. File operations use standard Node.js APIs.

## Creating Custom Adapters

Need database persistence, Redis, or other storage? Create your own adapter by implementing the simple `BaseAdapter` interface:

```typescript
import type { BaseAdapter } from "@evex/discord-webhook-queue";

class MyCustomAdapter implements BaseAdapter {
  async get(key: string): Promise<string | null> {
    // Get data by key, return null if not found
    return null;
  }

  async set(key: string, data: string): Promise<void> {
    // Set data by key
  }
}

const adapter = new MyCustomAdapter();
const queue = new WebhookQueue(webhookUrl, { adapter });
```

The `BaseAdapter` interface is intentionally simple - just `get(key)` and `set(key, data)` methods with string data. The queue handles all serialization internally.

### Custom Adapter Examples

**Database Adapter:**
```typescript
class DatabaseAdapter implements BaseAdapter {
  constructor(private db: Database) {}
  
  async get(key: string): Promise<string | null> {
    const result = await this.db.query("SELECT data FROM storage WHERE key = ?", [key]);
    return result.length > 0 ? result[0].data : null;
  }
  
  async set(key: string, data: string): Promise<void> {
    await this.db.execute(
      "INSERT OR REPLACE INTO storage (key, data) VALUES (?, ?)",
      [key, data]
    );
  }
}
```

**Redis Adapter:**
```typescript
class RedisAdapter implements BaseAdapter {
  constructor(private redis: RedisClient) {}
  
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }
  
  async set(key: string, data: string): Promise<void> {
    await this.redis.set(key, data);
  }
}
```

**LocalStorage Adapter (Browser):**
```typescript
class LocalStorageAdapter implements BaseAdapter {
  get(key: string): Promise<string | null> {
    return Promise.resolve(localStorage.getItem(key));
  }
  
  set(key: string, data: string): Promise<void> {
    localStorage.setItem(key, data);
    return Promise.resolve();
  }
}
```

## Usage Examples

### Basic Message

```typescript
await queue.enqueue({
  content: "Hello, Discord!"
});
```

### Rich Embed

```typescript
await queue.enqueue({
  username: "Status Bot",
  avatar_url: "https://example.com/bot-avatar.png",
  embeds: [{
    title: "System Status",
    description: "All systems operational",
    color: 0x00ff00,
    timestamp: new Date().toISOString(),
    fields: [
      {
        name: "Uptime",
        value: "99.9%",
        inline: true
      },
      {
        name: "Response Time",
        value: "< 100ms",
        inline: true
      }
    ],
    footer: {
      text: "Last updated",
      icon_url: "https://example.com/footer-icon.png"
    }
  }]
});
```

### Queue Management

```typescript
// Check queue status
console.log(`Queue length: ${queue.queueLength}`);
console.log(`Processing: ${queue.isProcessing}`);

// Clear all pending messages
await queue.clear();
```

## How It Works

1. **Enqueue**: Messages are immediately saved to your chosen persistence adapter
2. **Process**: The queue processes messages one by one with 500ms intervals
3. **Handle 429**: If Discord returns a 429 rate limit, wait 500ms and try again
4. **Success**: On 204/200 response, remove the message from storage
5. **Persistence**: Messages survive application restarts and continue processing

## Error Handling

The library handles different types of errors:

- **429 Rate Limited**: Automatically retries with 500ms delay
- **Other HTTP errors**: Removes message from queue and rejects the promise
- **Network errors**: Removes message from queue and rejects the promise

## API Reference

### WebhookQueue

#### Constructor
```typescript
new WebhookQueue(webhookUrl: string, options?: QueueOptions)
```

#### Methods
- `enqueue(message: WebhookMessage): Promise<Response>` - Add message to queue
- `clear(): Promise<void>` - Clear all pending messages
- `queueLength: number` - Get current queue length (getter)
- `isProcessing: boolean` - Check if queue is processing (getter)

### Types

- `WebhookMessage` - Discord webhook message format
- `QueueItem` - Internal queue item with ID and timestamp
- `BaseAdapter` - Simple interface for custom storage adapters (get/set methods)
- `QueueOptions` - Configuration options (currently just adapter)

## Development

### Prerequisites

- [Deno](https://deno.land/) 2.0 or later, OR
- [Node.js](https://nodejs.org/) 18.0 or later

### Commands

### Deno

```bash
# Run examples
deno run --allow-net example.ts
deno run --allow-net --allow-read --allow-write examples/file-adapter.ts
deno run --allow-net --allow-read --allow-write examples/custom-adapter.ts

# Format code
deno fmt

# Lint code
deno lint

# Type check
deno check mod.ts
```

### Node.js

```bash
# Run examples (after npm install)
node example.js
node examples/file-adapter.js
node examples/custom-adapter.js

# Type check (if using TypeScript)
npx tsc --noEmit
```

## License

MIT License