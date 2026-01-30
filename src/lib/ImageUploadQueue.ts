import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { db } from "./db";

interface PendingUpload {
  id: string;
  file: File;
  base64: string;
  documentId: string;
  retries: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

export class ImageUploadQueue {
  private queue: Map<string, PendingUpload> = new Map();
  private processing = false;
  private convex: ConvexClient;
  private onUploadComplete: (id: string, url: string) => void;

  constructor(convex: ConvexClient, onComplete: (id: string, url: string) => void) {
    this.convex = convex;
    this.onUploadComplete = onComplete;
    
    window.addEventListener('online', () => {
      console.log('[UploadQueue] Network online, resuming queue');
      this.processQueue();
    });
  }

  async add(id: string, file: File, base64: string, documentId: string) {
    console.log(`[UploadQueue] Adding ${id} to queue`);
    this.queue.set(id, {
      id,
      file,
      base64,
      documentId,
      retries: 0,
      status: 'pending',
    });
    
    await db.uploadQueue.put({
      tempId: id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      base64,
      documentId,
      retries: 0,
      status: 'pending',
      createdAt: Date.now(),
    });
    
    this.processQueue();
  }

  private async processQueue() {
    if (this.processing) return;
    
    const isOnline = typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true;
    if (!isOnline) {
      console.log('[UploadQueue] Offline, pausing queue processing');
      this.processing = false;
      return;
    }
    
    this.processing = true;

    for (const [id, upload] of this.queue) {
      if (upload.status !== 'pending') continue;

      try {
        upload.status = 'uploading';
        console.log(`[UploadQueue] Uploading ${id}...`);

        const uploadUrl = await this.convex.mutation(api.images.generateUploadUrl, {});
        
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": upload.file.type },
          body: upload.file,
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.status}`);
        }

        const { storageId } = await result.json();
        
        const { url } = await this.convex.mutation(api.images.saveImage, {
          storageId,
          documentId: upload.documentId,
        });

        if (!url) {
          throw new Error('No URL returned from saveImage');
        }

        upload.status = 'success';
        this.queue.delete(id);
        await db.uploadQueue.delete(id);
        
        console.log(`[UploadQueue] Upload complete: ${id} -> ${url}`);
        this.onUploadComplete(id, url);

      } catch (error) {
        console.error(`[UploadQueue] Upload failed for ${id}:`, error);
        upload.retries++;
        
        if (upload.retries >= 3) {
          upload.status = 'error';
          await db.uploadQueue.update(id, { status: 'error', retries: upload.retries });
          console.error(`[UploadQueue] Max retries reached for ${id}`);
        } else {
          upload.status = 'pending';
          await db.uploadQueue.update(id, { status: 'pending', retries: upload.retries });
          console.log(`[UploadQueue] Retrying ${id} (attempt ${upload.retries + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 1000 * upload.retries));
        }
      }
    }

    this.processing = false;
  }

  getStatus(id: string): 'pending' | 'uploading' | 'success' | 'error' | null {
    return this.queue.get(id)?.status || null;
  }

  async remove(id: string) {
    const upload = this.queue.get(id);
    if (upload) {
      console.log(`[UploadQueue] Removing ${id} from queue (status: ${upload.status})`);
      
      if (upload.status === 'uploading') {
        console.log(`[UploadQueue] Cancelling in-progress upload for ${id}`);
        upload.status = 'error';
      }
      
      this.queue.delete(id);
      await db.uploadQueue.delete(id);
    }
  }
  
  async restore() {
    console.log('[UploadQueue] Restoring queue from IndexedDB');
    const items = await db.uploadQueue.toArray();
    
    for (const item of items) {
      const blob = await fetch(item.base64).then(r => r.blob());
      const file = new File([blob], item.fileName, { type: item.fileType });
      
      this.queue.set(item.tempId, {
        id: item.tempId,
        file,
        base64: item.base64,
        documentId: item.documentId,
        retries: item.retries,
        status: item.status,
      });
    }
    
    console.log(`[UploadQueue] Restored ${items.length} pending uploads`);
    if (items.length > 0) {
      this.processQueue();
    }
  }
}
