import { db } from "./db";
import { api } from "../../convex/_generated/api";
import type { ConvexClient } from "convex/browser";



export type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error';

export class SyncEngine {
  private client: ConvexClient;
  private userId: string | null = null;
  private isPushing = false;
  private unsubscribe: (() => void) | null = null;
  private heartbeatId: number | any = null;
  private statusSubscribers: Set<(status: SyncStatus, lastSync: number | null) => void> = new Set();
  private _status: SyncStatus = 'offline';
  private _lastSync: number | null = null;

  constructor(client: ConvexClient) {
    this.client = client;
    this._lastSync = parseInt(localStorage.getItem("lastSync") || "0") || null;
    this.startHeartbeat();
    
    // Initial status check
    this.updateStatus(typeof navigator !== "undefined" && navigator.onLine ? 'synced' : 'offline');

    window.addEventListener("online", () => {
      this.updateStatus('syncing');
      this.subscribe();
      this.push();
    });
    window.addEventListener("offline", () => {
      this.updateStatus('offline');
      this.unsubscribe?.();
    });
  }

  public subscribeToStatus(callback: (status: SyncStatus, lastSync: number | null) => void): () => void {
    this.statusSubscribers.add(callback);
    // Initial call
    callback(this._status, this._lastSync);
    return () => this.statusSubscribers.delete(callback);
  }

  private updateStatus(status: SyncStatus) {
    this._status = status;
    this.notifyStatus();
  }

  private notifyStatus() {
    this.statusSubscribers.forEach(cb => cb(this._status, this._lastSync));
  }

  setUserId(userId: string | null) {
    this.userId = userId;
    if (userId) {
      const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
      if (isOnline) {
        this.updateStatus('syncing');
        this.subscribe();
        this.push();
      } else {
        this.updateStatus('offline');
      }
    } else {
      this.unsubscribe?.();
      this.updateStatus('offline'); 
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
          this.updateStatus('synced');
          this._lastSync = timestamp;
          this.notifyStatus();
          return;
        }

        await db.transaction("rw", db.folders, db.documents, async () => {
          for (const folder of folders) {
            await db.folders.put({
              id: folder.id,
              name: folder.name,
              type: folder.type as any, 
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
        this._lastSync = timestamp;
        this.updateStatus('synced');
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
    if (queue.length === 0) {
        if (this._status === 'syncing') this.updateStatus('synced');
        return;
    }

    const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
    if (!isOnline) {
        this.updateStatus('offline');
        return;
    }

    this.isPushing = true;
    this.updateStatus('syncing');
    
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
      this._lastSync = Date.now();
      this.updateStatus('synced');
    } catch (e) {
      console.error(e);
      this.updateStatus('error');
    } finally {
      this.isPushing = false;
    }
  }
}
