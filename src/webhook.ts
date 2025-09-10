import type { WebhookMessage } from "./types.ts";

export class DiscordWebhook {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async send(message: WebhookMessage): Promise<Response> {
    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("429 Rate Limited");
      } else {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }
    }

    return response;
  }
}
