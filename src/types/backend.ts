
export type DocumentType = "note" | "canvas" | "erd";
export type ShareMode = "view" | "edit";

export interface Folder {
  id: string;
  name: string;
  type: DocumentType;
  parentId?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
}

export interface Document {
  id: string;
  type: DocumentType;
  title: string;
  content: unknown;
  folderId?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  isArchived?: boolean;
  syncedAt?: number;
}

export interface SyncQueueItem {
  id?: number;
  entityType: "folder" | "document";
  entityId: string;
  action: "create" | "update" | "delete";
  data?: unknown;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}
