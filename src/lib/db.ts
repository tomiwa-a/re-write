import Dexie, { type EntityTable } from "dexie";
import type { Folder, Document, SyncQueueItem } from "../types/backend";

class ReWriteDB extends Dexie {
  folders!: EntityTable<Folder, "id">;
  documents!: EntityTable<Document, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super("rewrite");

    this.version(1).stores({
      folders: "id, parentId, updatedAt, syncedAt",
      documents: "id, type, folderId, updatedAt, syncedAt, isArchived",
      syncQueue: "++id, entityType, entityId, action, createdAt",
    });

    this.version(2).stores({
      folders: "id, type, parentId, updatedAt, syncedAt",
    });
  }
}

export const db = new ReWriteDB();
