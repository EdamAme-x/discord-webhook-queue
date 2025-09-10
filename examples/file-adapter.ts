import { WebhookQueue, FileAdapter } from "../mod.ts";

const webhookUrl = "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN";
const adapter = new FileAdapter("./webhook-queue.json");
const queue = new WebhookQueue(webhookUrl, { adapter });

console.log("File Adapter Example");

const messages = [
  {
    content: "Message 1: This will be saved to file",
    username: "File Bot",
  },
  {
    content: "Message 2: Even if the app crashes, this will be processed",
    embeds: [{
      title: "Persistent Message",
      description: "This message survives application restarts",
      color: 0x0099ff,
    }],
  },
  {
    content: "Message 3: Sequential processing with 500ms intervals",
    username: "Persistent Bot",
    embeds: [{
      title: "Rate Limit Handling",
      description: "429 errors are handled automatically",
      color: 0xff9900,
      fields: [
        {
          name: "Strategy",
          value: "Wait 500ms and retry",
          inline: true,
        },
        {
          name: "Persistence",
          value: "File-based storage",
          inline: true,
        },
      ],
    }],
  },
];

console.log(`Queue length: ${queue.queueLength}`);
console.log(`Processing: ${queue.isProcessing}`);
console.log(`Messages saved to: ./webhook-queue.json`);

// Uncomment to actually send messages:
// for (const message of messages) {
//   await queue.enqueue(message);
// }