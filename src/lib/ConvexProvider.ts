import * as Y from "yjs";
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

export class ConvexProvider {
    doc: Y.Doc;
    client: ConvexClient;
    documentId: string;
    private unsubscribe: (() => void) | null = null;
    
    constructor(client: ConvexClient, documentId: string, doc: Y.Doc) {
        this.client = client;
        this.documentId = documentId;
        this.doc = doc;

        // Initial Load & Subscribe
        this.connect();

        // Listen to local updates and push to Convex
        this.doc.on('update', this.handleLocalUpdate);
    }

    private async connect() {
        this.unsubscribe = this.client.onUpdate(
            api.collaboration.pullUpdates,
            { documentId: this.documentId },
            (updates: { update: ArrayBuffer, clientId: number }[]) => {
                this.applyRemoteUpdates(updates);
            }
        );
    }

    private applyRemoteUpdates(updates: { update: ArrayBuffer, clientId: number }[]) {
        Y.transact(this.doc, () => {
            updates.forEach(({ update }) => {
                Y.applyUpdate(this.doc, new Uint8Array(update), 'convex'); 
            });
        }, 'remote');
    }

    private handleLocalUpdate = (update: Uint8Array, origin: any) => {
        if (origin === 'remote' || origin === 'convex') return;

        this.client.mutation(api.collaboration.pushUpdate, {
            documentId: this.documentId,
            update: update.buffer as ArrayBuffer, // Cast to ArrayBuffer
            clientId: this.doc.clientID,
        }).catch(err => {
            console.error("Failed to push update:", err);
        });
    }

    public destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.doc.off('update', this.handleLocalUpdate);
    }
}
