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
