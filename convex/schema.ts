import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  folders: defineTable({
    id: v.string(),
    name: v.string(),
    parentId: v.optional(v.string()),
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
    folderId: v.optional(v.string()),
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

  users: defineTable({
    externalId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_external_id", ["externalId"]),
});