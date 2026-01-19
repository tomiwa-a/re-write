import { db } from "./db";
import { api } from "../../convex/_generated/api";
import type { ConvexClient } from "convex/browser";



export class SyncEngine {
  private client: ConvexClient;
  private userId: string | null = null;
  private isPushing = false;
  private unsubscribe: (() => void) | null = null;
  private heartbeatId: number | any = null;

  constructor(client: ConvexClient) {
    this.client = client;
    this.startHeartbeat();
    window.addEventListener("online", () => {
      this.subscribe();
      this.push();
    });
    window.addEventListener("offline", () => {
      this.unsubscribe?.();
    });
  }

  setUserId(userId: string | null) {
    this.userId = userId;
    if (userId) {
      const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
      if (isOnline) {
        this.subscribe();
        this.push();
      }
    } else {
      this.unsubscribe?.();
    }
  }

  requestSync() {
    this.push();
  }

  private startHeartbeat() {
    this.heartbeatId = setInterval(async () => {
      const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
      if (!isOnline || !this.userId) return;

      const count = await db.syncQueue.count();
      if (count > 0) {
        this.push();
      }
    }, 30_000);
  }

  private subscribe() {
    this.unsubscribe?.();
    if (!this.userId) return;

    const lastSync = parseInt(localStorage.getItem("lastSync") || "0");
    this.unsubscribe = this.client.onUpdate(
      api.sync.pull,
      { userId: this.userId, since: lastSync },
      async (result) => {
        const { folders, documents, timestamp } = result;

        if (folders.length === 0 && documents.length === 0) {
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
        this.subscribe();
      }
    );
  }

  async sync() {
    const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
    if (isOnline) {
      this.subscribe();
      await this.push();
    }
  }

  private async push() {
    if (this.isPushing || !this.userId) return;
    
    const queue = await db.syncQueue.toArray();
    if (queue.length === 0) return;

    const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
    if (!isOnline) return;

    this.isPushing = true;
    
    try {
      const changes = queue.map((item) => ({
        id: item.id!,
        entityType: item.entityType,
        entityId: item.entityId,
        action: item.action,
        data: item.data,
      }));

      await this.client.mutation(api.sync.push, {
        changes,
        userId: this.userId,
      });

      const ids = queue.map((q) => q.id as number);
      await db.syncQueue.bulkDelete(ids);
    } catch (e) {
      console.error(e);
    } finally {
      this.isPushing = false;
    }
  }
}
