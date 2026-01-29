import { Editor } from '@tiptap/core';
import { SyncEngine } from '../lib/sync';
import { documentService } from '../lib/documents';

export class EditorManager {
    private editor: Editor | null = null;
    private editorEl: HTMLElement;
    private toolbarEl: HTMLElement;
    private syncEngine: SyncEngine;

    private currentDocId: string | null = null;
    private saveTimeout: any = null;
    private isLoaded: boolean = false;

    constructor(syncEngine: SyncEngine) {
        this.syncEngine = syncEngine;
        this.editorEl = document.getElementById('editor-content') as HTMLElement;
        this.toolbarEl = document.getElementById('editor-toolbar') as HTMLElement;
    }

    public init(): void {
        console.log('[EditorManager] init() called');
        this.syncEngine.subscribeToEntities((changes) => {
            if (this.currentDocId && changes.documents.includes(this.currentDocId)) {
                this.handleRemoteUpdate(this.currentDocId);
            }
        });
    }

    private async handleRemoteUpdate(id: string) {
        // Debounce or check if we have pending local changes? 
        // For now, simple reload if we are not actively typing (handled by Tiptap mostly keeping state, but full reload might lose cursor)
        // Ideally we diff, but full reload is safer for "v1" sync
        console.log('[EditorManager] Remote update detected for:', id);
        
        // Don't overwrite if we have a pending save (local changes win or merge? "Last write wins" usually means server wins if it just arrived)
        // But if we just typed, we want to keep our changes. 
        // If we have a saveTimeout, it means we have unsaved local changes. 
        if (this.saveTimeout) {
            console.log('[EditorManager] Skipping remote update due to pending local changes');
            return;
        }

        const doc = await documentService.getById(id);
        if (doc && this.editor) {
            const currentContent = JSON.stringify(this.editor.getJSON());
            const newContent = JSON.stringify(doc.content);
            
            if (currentContent !== newContent) {
                 console.log('[EditorManager] Applying remote content update');
                 // This might move cursor to start, acceptable for now
                 const {  from, to } = this.editor.state.selection;
                 this.editor.commands.setContent(doc.content || '');
                 this.editor.commands.setTextSelection({ from, to });
            }
        }
    }


    private scheduleSave(): void {
        if (!this.isLoaded) return;
        
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            if (this.currentDocId && this.editor) {
                console.log('[EditorManager] Auto-saving document:', this.currentDocId);
                this.saveDocument();
            }
        }, 1000);
    }

    private async saveDocument(): Promise<void> {
        if (!this.currentDocId || !this.editor) return;
        console.log('[EditorManager] saveDocument() for:', this.currentDocId);
        const json = this.editor.getJSON();
        await documentService.update(this.currentDocId, { content: json });
        this.saveTimeout = null;
    }

    public async openDocument(id: string): Promise<void> {
        console.log('[EditorManager] openDocument() called with ID:', id);
        this.isLoaded = false;
        
        // Save previous doc if needed
        if (this.currentDocId) {
             console.log('[EditorManager] Saving previous document:', this.currentDocId);
             await this.saveDocument();
        }

        console.log('[EditorManager] Destroying previous editor state');
        await this.destroy(); 
        
        this.currentDocId = id;
        const doc = await documentService.getById(id);
        
        if (!doc) {
            console.error('[EditorManager] Document not found:', id);
            // Handle 404
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
    
    // ... openCanvas (unchanged for now, or similar fix needed?) ...
    private async openCanvas(doc: any) {
        console.log('[EditorManager] Opening Canvas editor');
        const { mountCanvas } = await import('../components/mountCanvas');
        
        if (this.toolbarEl) this.toolbarEl.style.display = 'none';
        
        this.editorEl.innerHTML = '';
        console.log('[EditorManager] Mounting Canvas');
        
        mountCanvas(this.editorEl, {
            initialContent: doc.content,
            onChange: (newContent: any) => {
                 if (this.isLoaded) this.handleCanvasChange(newContent);
            }
        });
    }

    private handleCanvasChange(content: any) {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            if (this.currentDocId) {
                console.log('[EditorManager] Auto-saving Canvas:', this.currentDocId);
                await documentService.update(this.currentDocId, { content });
                this.saveTimeout = null;
            }
        }, 1000);
    }

    private async openTiptap(doc: any) {
        console.log('[EditorManager] Opening Tiptap editor');
        const { createEditor } = await import('../editor');
        
        // Show toolbar
        if (this.toolbarEl) this.toolbarEl.style.display = 'flex';
        
        // Re-init Tiptap
        console.log('[EditorManager] Creating Tiptap instance with content length:', doc.content ? JSON.stringify(doc.content).length : 0);
        this.editor = createEditor(this.editorEl, this.toolbarEl, doc.content || '');
        this.editor.setEditable(true);
        
        this.editor.on('update', () => {
             this.scheduleSave();
        });
        console.log('[EditorManager] Tiptap instance created');
    }

    public async destroy(): Promise<void> {
        console.log('[EditorManager] destroy() called');
        // Destroy Tiptap
        if (this.editor) {
            console.log('[EditorManager] Destroying Tiptap instance');
            this.editor.destroy();
            this.editor = null;
        }

        // Unmount Canvas if active
        // dynamic import to avoid eager loading
        const { unmountCanvas } = await import('../components/mountCanvas');
        unmountCanvas();
        
        // Clear container
        if (this.editorEl) {
            console.log('[EditorManager] Clearing editor element innerHTML');
            this.editorEl.innerHTML = '';
        }
        
        // Reset toolbar state
        if (this.toolbarEl) this.toolbarEl.style.display = 'flex';
    }
}
