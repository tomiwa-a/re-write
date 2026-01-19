import { db } from "./db";
import { api } from "../../convex/_generated/api";
import type { ConvexReactClient } from "convex/react";

const SYNC_INTERVAL = 10_000; // 10 seconds

export class SyncEngine {
  private client: ConvexReactClient;
  private userId: string | null = null;
  private isSyncing = false;
  private intervalId: number | null = null;

  constructor(client: ConvexReactClient) {
    this.client = client;
  }

  setUserId(userId: string | null) {
    this.userId = userId;
    if (userId) {
      this.start();
    } else {
      this.stop();
    }
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.sync(), SYNC_INTERVAL);
    // Initial sync
    this.sync();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async sync() {
    if (this.isSyncing || !this.userId || !navigator.onLine) return;

    try {
      this.isSyncing = true;
      console.log("Starting sync...");

      await this.push();
      await this.pull();

      console.log("Sync complete");
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async push() {
    const queue = await db.syncQueue.toArray();
    if (queue.length === 0) return;

    const changes = queue.map((item) => ({
      id: item.id!,
      entityType: item.entityType,
      entityId: item.entityId,
      action: item.action,
      data: item.data,
    }));

    if (!this.userId) return;

    await this.client.mutation(api.sync.push, {
      changes,
      userId: this.userId,
    });

    const ids = queue.map((q) => q.id as number);
    await db.syncQueue.bulkDelete(ids);
  }

  private async pull() {
    if (!this.userId) return;

    const lastSync = parseInt(localStorage.getItem("lastSync") || "0");

    const { folders, documents, timestamp } = await this.client.query(api.sync.pull, {
      userId: this.userId,
      since: lastSync,
    });

    if (folders.length === 0 && documents.length === 0) {
      localStorage.setItem("lastSync", timestamp.toString());
      return;
    }

    await db.transaction("rw", db.folders, db.documents, async () => {
      for (const folder of folders) {
        await db.folders.put({
          id: folder.id,
          name: folder.name,
          parentId: folder.parentId,
          userId: folder.userId,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
          syncedAt: timestamp,
        });
      }

      for (const doc of documents) {
        await db.documents.put({
          id: doc.id,
          type: doc.type as any,
          title: doc.title,
          content: doc.content,
          folderId: doc.folderId,
          userId: doc.userId,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          isArchived: doc.isArchived,
          syncedAt: timestamp,
        });
      }
    });

    localStorage.setItem("lastSync", timestamp.toString());
  }
}
