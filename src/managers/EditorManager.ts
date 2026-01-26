import { Editor } from '@tiptap/core';

import { documentService } from '../lib/documents';

export class EditorManager {
    private editor: Editor | null = null;
    private editorEl: HTMLElement;
    private toolbarEl: HTMLElement;

    private currentDocId: string | null = null;
    private saveTimeout: any = null;

    constructor() {
        this.editorEl = document.getElementById('editor-content') as HTMLElement;
        this.toolbarEl = document.getElementById('editor-toolbar') as HTMLElement;
    }

    public init(): void {
        console.log('[EditorManager] init() called');
    }


    private scheduleSave(): void {
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
    }

    public async openDocument(id: string): Promise<void> {
        console.log('[EditorManager] openDocument() called with ID:', id);
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
        } else if (doc.type === 'erd') {
            await this.openERD(doc);
        } else {
            await this.openTiptap(doc);
        }
    }

    private async openERD(doc: any) {
        console.log('[EditorManager] Opening ERD editor');
        const { mountERD } = await import('../components/mountERD');
        
        // Hide toolbar for ERD 
        if (this.toolbarEl) this.toolbarEl.style.display = 'none';
        
        this.editorEl.innerHTML = '';
        mountERD(this.editorEl, {
            initialContent: doc.content,
            onChange: (newContent: any) => {
                this.handleERDChange(newContent);
            }
        });
    }

    private handleERDChange(content: any) {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            if (this.currentDocId) {
                console.log('[EditorManager] Auto-saving ERD:', this.currentDocId);
                await documentService.update(this.currentDocId, { content });
            }
        }, 1000);
    }

    private async openCanvas(doc: any) {
        console.log('[EditorManager] Opening Canvas editor');
        const { mountCanvas } = await import('../components/mountCanvas');
        
        // Hide toolbar for canvas 
        if (this.toolbarEl) this.toolbarEl.style.display = 'none';
        
        // Ensure editor element is clean/ready
        this.editorEl.innerHTML = '';
        console.log('[EditorManager] Mounting Canvas');
        
        mountCanvas(this.editorEl, {
            initialContent: doc.content,
            onChange: (newContent: any) => {
                 this.handleCanvasChange(newContent);
            }
        });
    }

    private handleCanvasChange(content: any) {
        
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            if (this.currentDocId) {
                console.log('[EditorManager] Auto-saving Canvas:', this.currentDocId);
                await documentService.update(this.currentDocId, { content });
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

        // Unmount Canvas/ERD if active
        const { unmountCanvas } = await import('../components/mountCanvas');
        const { unmountERD } = await import('../components/mountERD');
        unmountCanvas();
        unmountERD();
        
        // Clear container
        if (this.editorEl) {
            console.log('[EditorManager] Clearing editor element innerHTML');
            this.editorEl.innerHTML = '';
        }
        
        // Reset toolbar state
        if (this.toolbarEl) this.toolbarEl.style.display = 'flex';
    }
}
