import * as Y from "yjs";
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Awareness } from "y-protocols/awareness";
export class ConvexProvider {
    doc: Y.Doc;
    client: ConvexClient;
    documentId: string;
    awareness: Awareness;
    private unsubscribe: (() => void) | null = null;
    private unsubscribePresence: (() => void) | null = null;
    private awarenessUpdateInterval: any = null;
    
    constructor(client: ConvexClient, documentId: string, doc: Y.Doc) {
        this.client = client;
        this.documentId = documentId;
        this.doc = doc;
        this.awareness = new Awareness(doc);

        this.connect();
        
        this.doc.on('update', this.handleLocalUpdate);
        this.startAwarenessLoop();
    }

    get document() {
        return this.doc;
    }

    private async connect() {
        // 1. Document Updates (History)
        this.unsubscribe = this.client.onUpdate(
            api.collaboration.pullUpdates,
            { documentId: this.documentId },
            (updates: { update: ArrayBuffer, clientId: number }[]) => {
                this.applyRemoteUpdates(updates);
            }
        );

        // 2. Presence Updates (Cursors)
        this.unsubscribePresence = this.client.onUpdate(
            api.collaboration.getPresence,
            { documentId: this.documentId },
            (states: any[]) => {
               this.applyPresenceUpdates(states);
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

    private applyPresenceUpdates(states: any[]) {
        const awarenessStates: any = {};
        states.forEach((state) => {
            if (state.clientId !== this.doc.clientID) {
                awarenessStates[state.clientId] = state.user;
                this.awareness.states.set(state.clientId, state.user);
            }
        });
        
        this.awareness.emit('change', [{ added: [], updated: [], removed: [] }, 'remote']);
    }

    private startAwarenessLoop() {
        const pushMyState = () => {
             const myState = this.awareness.getLocalState();
             if (!myState) return;

             this.client.mutation(api.collaboration.updatePresence, {
                 documentId: this.documentId,
                 clientId: this.doc.clientID,
                 user: myState,
             }).catch(e => console.error(e));
        };

        let timer: any = null;
        this.awareness.on('change', ({}, origin: any) => {
            if (origin === 'local') {
                if (timer) clearTimeout(timer);
                timer = setTimeout(pushMyState, 200);
            }
        });

        this.awarenessUpdateInterval = setInterval(pushMyState, 5000);
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
        if (this.unsubscribePresence) {
            this.unsubscribePresence();
            this.unsubscribePresence = null;
        }
        if (this.awarenessUpdateInterval) {
            clearInterval(this.awarenessUpdateInterval);
        }
        this.doc.off('update', this.handleLocalUpdate);
        this.awareness.destroy();
    }
}
