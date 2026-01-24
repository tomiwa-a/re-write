import { db } from "./db";
import type { Document, DocumentType } from "../types/backend";

function generateId(): string {
  return crypto.randomUUID();
}

export const documentService = {
  async create(data: {
    type: DocumentType;
    title: string;
    content?: unknown;
    folderId?: string;
    userId: string;
    isLocalOnly?: boolean;
  }): Promise<Document> {
    const now = Date.now();
    const doc: Document = {
      id: generateId(),
      type: data.type,
      title: data.title,
      content: data.content ?? null,
      folderId: data.folderId,
      userId: data.userId,
      createdAt: now,
      updatedAt: now,
      isArchived: false,
      isLocalOnly: data.isLocalOnly,
    };

    await db.documents.add(doc);
    
    // Only add to sync queue if NOT local only
    if (!doc.isLocalOnly) {
      // Strip syncedAt and isLocalOnly before syncing
      const { syncedAt, isLocalOnly, ...syncData } = doc as any;
      await db.syncQueue.add({
        entityType: "document",
        entityId: doc.id,
        action: "create",
        data: syncData,
        createdAt: now,
      });
    }

    return doc;
  },

  async getAll(): Promise<Document[]> {
    return await db.documents.filter((d) => !d.isArchived).toArray();
  },

  async getById(id: string): Promise<Document | undefined> {
    return await db.documents.where("id").equals(id).first();
  },

  async getByFolder(folderId?: string): Promise<Document[]> {
    if (folderId === undefined) {
      return await db.documents
        .filter((d) => d.folderId === undefined && !d.isArchived)
        .toArray();
    }
    return await db.documents
      .where("folderId")
      .equals(folderId)
      .filter((d) => !d.isArchived)
      .toArray();
  },

  async getByType(type: DocumentType): Promise<Document[]> {
    return await db.documents
      .where("type")
      .equals(type)
      .filter((d) => !d.isArchived)
      .toArray();
  },

  async update(
    id: string,
    data: Partial<Omit<Document, "id" | "createdAt" | "type">>
  ): Promise<Document | undefined> {
    const now = Date.now();
    await db.documents.update(id, { ...data, updatedAt: now });

    const updated = await db.documents.where("id").equals(id).first();
    if (updated && !updated.isLocalOnly) {
      // Strip syncedAt and isLocalOnly before syncing
      const { syncedAt, isLocalOnly, ...syncData } = updated as any;
      await db.syncQueue.add({
        entityType: "document",
        entityId: id,
        action: "update",
        data: syncData,
        createdAt: now,
      });
    }

    return updated;
  },

  async archive(id: string): Promise<void> {
    await this.update(id, { isArchived: true });
  },

  async restore(id: string): Promise<void> {
    await this.update(id, { isArchived: false });
  },

  async remove(id: string): Promise<void> {
    const doc = await db.documents.where("id").equals(id).first();
    await db.documents.delete(id);
    
    if (doc && !doc.isLocalOnly) {
      await db.syncQueue.add({
        entityType: "document",
        entityId: id,
        action: "delete",
        createdAt: Date.now(),
      });
    }
  },

  async getArchived(): Promise<Document[]> {
    return await db.documents.filter((d) => d.isArchived === true).toArray();
  },
};
