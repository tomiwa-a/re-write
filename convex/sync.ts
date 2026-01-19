import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const push = mutation({
  args: {
    changes: v.array(
      v.object({
        id: v.number(), 
        entityType: v.union(v.literal("folder"), v.literal("document")),
        entityId: v.string(), // UUID
        action: v.union(
          v.literal("create"),
          v.literal("update"),
          v.literal("delete")
        ),
        data: v.optional(v.any()), // Can be Folder or Document
      })
    ),
    userId: v.string(), // TODO: Use auth
  },
  handler: async (ctx, args) => {
    const userId = args.userId;

    for (const change of args.changes) {
      const { entityType, entityId, action, data } = change;
      const table = entityType === "folder" ? "folders" : "documents";

      const existing = await ctx.db
        .query(table)
        .withIndex("by_uuid", (q) => q.eq("id", entityId))
        .first();

      if (action === "delete") {
        if (existing) {
          await ctx.db.delete(existing._id);
        }
      } else {
        if (!data) continue;

        if (existing) {
          await ctx.db.patch(existing._id, {
            ...data,
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert(table, {
            ...data,
            id: entityId,
            userId,
            updatedAt: Date.now(),
          });
        }
      }
    }
  },
});

export const pull = query({
  args: {
    since: v.number(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const [folders, documents] = await Promise.all([
      ctx.db
        .query("folders")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gt(q.field("updatedAt"), args.since))
        .collect(),
      ctx.db
        .query("documents")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gt(q.field("updatedAt"), args.since))
        .collect(),
    ]);

    return {
      folders,
      documents,
      timestamp: Date.now(),
    };
  },
});
