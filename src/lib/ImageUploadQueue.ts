import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

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
    
    this.processQueue();
  }

  private async processQueue() {
    if (this.processing) return;
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
        
        console.log(`[UploadQueue] Upload complete: ${id} -> ${url}`);
        this.onUploadComplete(id, url);

      } catch (error) {
        console.error(`[UploadQueue] Upload failed for ${id}:`, error);
        upload.retries++;
        
        if (upload.retries >= 3) {
          upload.status = 'error';
          console.error(`[UploadQueue] Max retries reached for ${id}`);
        } else {
          upload.status = 'pending';
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

  remove(id: string) {
    console.log(`[UploadQueue] Removing ${id} from queue`);
    this.queue.delete(id);
  }
}
