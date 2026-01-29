import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const pushUpdate = mutation({
  args: {
    documentId: v.string(),
    update: v.bytes(),
    clientId: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("document_updates", {
      documentId: args.documentId,
      update: args.update,
      clientId: args.clientId,
    });
  },
});

export const pullUpdates = query({
  args: {
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    const updates = await ctx.db
      .query("document_updates")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    return updates.map((u) => ({
      update: u.update,
      clientId: u.clientId,
    }));
  },
});

export const updatePresence = mutation({
  args: {
    documentId: v.string(),
    clientId: v.number(),
    user: v.any(),
  },
  handler: async (ctx, args) => {
    const { documentId, clientId, user } = args;
    const existing = await ctx.db
      .query("document_presence")
      .withIndex("by_client", (q) => q.eq("documentId", documentId).eq("clientId", clientId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { user, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("document_presence", {
        documentId,
        clientId,
        user,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getPresence = query({
  args: { documentId: v.string() },
  handler: async (ctx, args) => {
    const threshold = Date.now() - 10000; // 10 seconds timeout
    return await ctx.db
      .query("document_presence")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.gt(q.field("updatedAt"), threshold))
      .collect();
  },
});
