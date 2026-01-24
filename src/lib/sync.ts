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
    console.log(`[SyncEngine] setUserId:`, userId);
    this.userId = userId;
    if (userId) {
      const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
      console.log(`[SyncEngine] isOnline:`, isOnline);
      if (isOnline) {
        this.updateStatus('syncing');
        this.subscribe();
        this.push();
      } else {
        this.updateStatus('offline');
      }
    } else {
      console.log(`[SyncEngine] User logged out, clearing lastSync`);
      this.unsubscribe?.();
      localStorage.removeItem("lastSync");
      this._lastSync = null;
      this.updateStatus('offline'); 
    }
  }

  requestSync() {
    console.log(`[SyncEngine] Manual sync requested`);
    this.push();
  }

  private startHeartbeat() {
    this.heartbeatId = setInterval(async () => {
      const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
      if (!isOnline || !this.userId) return;

      const count = await db.syncQueue.count();
      if (count > 0) {
        console.log(`[SyncEngine] Heartbeat: found ${count} pending items`);
        this.push();
      }
    }, 30_000);
  }

  private subscribe() {
    console.log(`[SyncEngine] Subscribing...`);
    this.unsubscribe?.();
    if (!this.userId) {
      console.log(`[SyncEngine] No userId, aborting subscribe`);
      return;
    }

    const lastSync = parseInt(localStorage.getItem("lastSync") || "0");
    console.log(`[SyncEngine] Subscribing with lastSync:`, lastSync);
    this.unsubscribe = this.client.onUpdate(
      api.sync.pull,
      { userId: this.userId, since: lastSync },
      async (result) => {
        console.log(`[SyncEngine] Pull received:`, result);
        const { folders, documents, timestamp } = result;

        if (folders.length === 0 && documents.length === 0) {
          console.log(`[SyncEngine] No changes to pull`);
          this.updateStatus('synced');
          this._lastSync = timestamp;
          this.notifyStatus();
          return;
        }

        console.log(`[SyncEngine] Pulling ${folders.length} folders, ${documents.length} documents`);
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
            });
          }
        });

        localStorage.setItem("lastSync", timestamp.toString());
        this._lastSync = timestamp;
        this.updateStatus('synced');
        console.log(`[SyncEngine] Pull complete, resubscribing`);
        this.subscribe();
      }
    );
  }

  async sync() {
    console.log(`[SyncEngine] sync() called`);
    const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
    if (isOnline) {
      this.subscribe();
      await this.push();
    } else {
      console.log(`[SyncEngine] Offline, skipping sync`);
    }
  }

  private async push() {
    console.log(`[SyncEngine] push() called`);
    if (this.isPushing) {
      console.log(`[SyncEngine] Already pushing, skipping`);
      return;
    }
    if (!this.userId) {
      console.log(`[SyncEngine] No userId, skipping push`);
      return;
    }
    
    const queue = await db.syncQueue.toArray();
    console.log(`[SyncEngine] Queue size:`, queue.length);
    if (queue.length === 0) {
        if (this._status === 'syncing') this.updateStatus('synced');
        return;
    }

    const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
    if (!isOnline) {
        console.log(`[SyncEngine] Offline, aborting push`);
        this.updateStatus('offline');
        return;
    }

    this.isPushing = true;
    this.updateStatus('syncing');
    
    try {
      console.log(`[SyncEngine] Pushing ${queue.length} changes to server`);
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

      console.log(`[SyncEngine] Push successful, clearing queue`);
      const ids = queue.map((q) => q.id as number);
      await db.syncQueue.bulkDelete(ids);
      this._lastSync = Date.now();
      this.updateStatus('synced');
    } catch (e) {
      console.error(`[SyncEngine] Push failed:`, e);
      this.updateStatus('error');
    } finally {
      this.isPushing = false;
    }
  }
}
