import { WebhookQueue } from "./mod.ts";

const webhookUrl = "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN";
const queue = new WebhookQueue(webhookUrl);

const _message = {
  content: "Hello from Discord Webhook Queue!",
  username: "Bot",
  embeds: [{
    title: "Test Embed",
    description: "Sequential processing with 500ms intervals",
    color: 0x00ff00,
  }],
};

console.log("Discord Webhook Queue ready");
console.log(`Queue length: ${queue.queueLength}`);
console.log(`Processing: ${queue.isProcessing}`);

// Uncomment to send: await queue.enqueue(_message);