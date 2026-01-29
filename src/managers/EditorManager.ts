import { Editor } from '@tiptap/core';

import { documentService } from '../lib/documents';
import { ConvexClient } from "convex/browser";
import * as Y from 'yjs';
import Collaboration from '@tiptap/extension-collaboration';
import { ConvexProvider } from '../lib/ConvexProvider';
import { IndexeddbPersistence } from 'y-indexeddb';

export class EditorManager {
    private editor: Editor | null = null;
    private editorEl: HTMLElement;
    private toolbarEl: HTMLElement;
    private convexClient: ConvexClient;
    private convexProvider: ConvexProvider | null = null;
    private persistence: IndexeddbPersistence | null = null;
    private ydoc: Y.Doc | null = null;

    private currentDocId: string | null = null;
    private saveTimeout: any = null;
    private isLoaded: boolean = false;

    constructor(convexClient: ConvexClient) {
        console.log('[EditorManager] constructor');
        this.convexClient = convexClient;
        this.editorEl = document.getElementById('editor-content') as HTMLElement;
        this.toolbarEl = document.getElementById('editor-toolbar') as HTMLElement;
    }

    public init(): void {
        console.log('[EditorManager] init() called');
    }

    private scheduleSave(): void {
        if (!this.isLoaded) return;
        
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            if (this.currentDocId) {
                console.log('[EditorManager] Touching document timestamp:', this.currentDocId);
                this.touchDocument();
            }
        }, 5000);
    }

    private async touchDocument(): Promise<void> {
        if (!this.currentDocId) return;
        await documentService.update(this.currentDocId, { updatedAt: Date.now() });
        this.saveTimeout = null;
    }

    public async openDocument(id: string): Promise<void> {
        console.log('[EditorManager] openDocument() called with ID:', id);
        this.isLoaded = false;
        
        console.log('[EditorManager] Destroying previous editor state');
        await this.destroy(); 
        
        this.currentDocId = id;
        const doc = await documentService.getById(id);
        
        if (!doc) {
            console.error('[EditorManager] Document not found:', id);
            return;
        }
        
        console.log('[EditorManager] Document loaded:', { id: doc.id, type: doc.type });

        // Switch based on type
        if (doc.type === 'canvas') {
            await this.openCanvas(doc);
        } else {
            await this.openTiptap(doc);
        }
        
        // Allow updates after a tick
        setTimeout(() => {
            this.isLoaded = true;
        }, 100);
    }
    
    private async openCanvas(doc: any) {
        console.log('[EditorManager] Opening Canvas editor (Y.js not yet implemented for Canvas)');
        const { mountCanvas } = await import('../components/mountCanvas');
        
        if (this.toolbarEl) this.toolbarEl.style.display = 'none';
        
        this.editorEl.innerHTML = '';
        
        mountCanvas(this.editorEl, {
            initialContent: doc.content,
            onChange: (newContent: any) => {
                 documentService.update(doc.id, { content: newContent });
            }
        });
    }

    private async openTiptap(doc: any) {
        console.log('[EditorManager] Opening Tiptap editor with Y.js');
        const { createEditor } = await import('../editor');
        
        if (this.toolbarEl) this.toolbarEl.style.display = 'flex';
        
        this.ydoc = new Y.Doc();

        this.persistence = new IndexeddbPersistence(doc.id, this.ydoc);
        
        this.persistence.on('synced', () => {
            console.log('[EditorManager] Y.js local persistence loaded');
        });

        this.convexProvider = new ConvexProvider(this.convexClient, doc.id, this.ydoc);
        
        const extensions = [
            Collaboration.configure({
                document: this.ydoc,
            })
        ];

        this.editor = createEditor(this.editorEl, this.toolbarEl, doc.content || '', extensions);
        this.editor.setEditable(true);
        
        this.editor.on('update', () => {
             this.scheduleSave();
        });
        
        console.log('[EditorManager] Tiptap instance created with Y.js');
    }

    public async destroy(): Promise<void> {
        console.log('[EditorManager] destroy() called');
        
        if (this.editor) {
            this.editor.destroy();
            this.editor = null;
        }

        if (this.convexProvider) {
            this.convexProvider.destroy();
            this.convexProvider = null;
        }
        
        if (this.persistence) {
            this.persistence.destroy();
            this.persistence = null;
        }

        if (this.ydoc) {
            this.ydoc.destroy();
            this.ydoc = null;
        }

        // Unmount Canvas if active
        const { unmountCanvas } = await import('../components/mountCanvas');
        unmountCanvas();
        
        if (this.editorEl) {
            this.editorEl.innerHTML = '';
        }
        
        if (this.toolbarEl) this.toolbarEl.style.display = 'flex';
    }
}
