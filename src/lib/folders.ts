import { db } from "./db";
import type { Folder } from "../types/backend";

function generateId(): string {
  return crypto.randomUUID();
}

export const folderService = {
  async create(data: Omit<Folder, "id" | "createdAt" | "updatedAt">): Promise<Folder> {
    const now = Date.now();
    const folder: Folder = {
      id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await db.folders.add(folder);
    await db.syncQueue.add({
      entityType: "folder",
      entityId: folder.id,
      action: "create",
      data: folder,
      createdAt: now,
    });

    return folder;
  },

  async getAll(): Promise<Folder[]> {
    return await db.folders.toArray();
  },

  async getById(id: string): Promise<Folder | undefined> {
    return await db.folders.get(id);
  },

  async getChildren(parentId?: string): Promise<Folder[]> {
    if (parentId === undefined) {
      return await db.folders.filter((f) => f.parentId === undefined).toArray();
    }
    return await db.folders.where("parentId").equals(parentId).toArray();
  },

  async update(id: string, data: Partial<Omit<Folder, "id" | "createdAt">>): Promise<Folder | undefined> {
    const now = Date.now();
    await db.folders.update(id, { ...data, updatedAt: now });

    const updated = await db.folders.get(id);
    if (updated) {
      await db.syncQueue.add({
        entityType: "folder",
        entityId: id,
        action: "update",
        data: updated,
        createdAt: now,
      });
    }

    return updated;
  },

  async remove(id: string): Promise<void> {
    const children = await db.folders.where("parentId").equals(id).toArray();
    for (const child of children) {
      await this.remove(child.id);
    }

    const docs = await db.documents.where("folderId").equals(id).toArray();
    for (const doc of docs) {
      // Recursive delete documents
      await db.documents.delete(doc.id);
      await db.syncQueue.add({
        entityType: "document",
        entityId: doc.id,
        action: "delete",
        createdAt: Date.now(),
      });
    }

    await db.folders.delete(id);
    await db.syncQueue.add({
      entityType: "folder",
      entityId: id,
      action: "delete",
      createdAt: Date.now(),
    });
  },
};
