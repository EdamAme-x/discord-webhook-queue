import { readFile, writeFile } from "node:fs/promises";
import type { BaseAdapter } from "../src/types.ts";

export class FileAdapter implements BaseAdapter {
  private filePath: string;

  constructor(filePath: string = "./webhook-queue.json") {
    this.filePath = filePath;
  }

  async get(key: string): Promise<string | null> {
    try {
      const data = await readFile(this.filePath, "utf-8");
      const parsed: Record<string, string> = JSON.parse(data);
      return parsed[key] ?? null;
    } catch (error: unknown) {
      if ((error as { code?: string }).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async set(key: string, data: string): Promise<void> {
    let existing: Record<string, string> = {};
    try {
      const fileData = await readFile(this.filePath, "utf-8");
      existing = JSON.parse(fileData);
    } catch (error: unknown) {
      if ((error as { code?: string }).code !== "ENOENT") {
        throw error;
      }
    }

    existing[key] = data;
    await writeFile(this.filePath, JSON.stringify(existing, null, 2), "utf-8");
  }
}