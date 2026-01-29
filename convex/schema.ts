import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  folders: defineTable({
    id: v.string(),
    name: v.string(),
    type: v.union(v.literal("note"), v.literal("canvas"), v.literal("erd")),
    parentId: v.optional(v.union(v.string(), v.null())),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_parent", ["parentId"])
    .index("by_uuid", ["id"]),

  documents: defineTable({
    id: v.string(),
    type: v.union(v.literal("note"), v.literal("canvas"), v.literal("erd")),
    title: v.string(),
    content: v.any(),
    folderId: v.optional(v.union(v.string(), v.null())),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isArchived: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_folder", ["folderId"])
    .index("by_type", ["userId", "type"])
    .index("by_uuid", ["id"]),

  shares: defineTable({
    documentId: v.id("documents"),
    ownerId: v.string(),
    token: v.string(),
    mode: v.union(v.literal("view"), v.literal("edit")),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_document", ["documentId"]),

  document_updates: defineTable({
    documentId: v.string(),
    update: v.bytes(), 
    clientId: v.number(), 
  })
    .index("by_document", ["documentId"]),

  document_presence: defineTable({
    documentId: v.string(),
    clientId: v.number(),
    user: v.any(), // JSON object for name, color, etc.
    updatedAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_client", ["documentId", "clientId"]),
});