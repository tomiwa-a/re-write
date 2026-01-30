import Dexie, { type EntityTable } from "dexie";
import type { Folder, Document, SyncQueueItem } from "../types/backend";

interface UploadQueueItem {
  tempId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  base64: string;
  documentId: string;
  retries: number;
  status: 'pending' | 'uploading' | 'error';
  createdAt: number;
}

class CelluloseDB extends Dexie {
  folders!: EntityTable<Folder, "id">;
  documents!: EntityTable<Document, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;
  uploadQueue!: EntityTable<UploadQueueItem, "tempId">;

  constructor() {
    super("cellulose");

    this.version(1).stores({
      folders: "id, parentId, updatedAt",
      documents: "id, type, folderId, updatedAt, isArchived",
      syncQueue: "++id, entityType, entityId, action, createdAt",
    });

    this.version(2).stores({
      folders: "id, type, parentId, updatedAt",
    });

    this.version(3).stores({
      documents: "id, type, folderId, updatedAt, isArchived, isLocalOnly",
    });
    
    this.version(4).stores({
      uploadQueue: "tempId, documentId, status, createdAt",
    });
  }
}

export const db = new CelluloseDB();
