import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveImage = mutation({
  args: {
    storageId: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    const imageId = await ctx.db.insert("images", {
      storageId: args.storageId,
      documentId: args.documentId,
      uploadedAt: Date.now(),
    });
    
    const url = await ctx.storage.getUrl(args.storageId);
    return { imageId, url };
  },
});
