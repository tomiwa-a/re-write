import { createEditor } from '../editor';
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
        this.setupEditor();
    }

    private setupEditor(): void {
        if (this.toolbarEl && this.editorEl) {
            this.editor = createEditor(this.editorEl, this.toolbarEl);
            
            this.editor.on('update', () => {
                if (this.currentDocId) {
                    this.scheduleSave();
                }
            });
        }
    }

    private scheduleSave(): void {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            if (this.currentDocId && this.editor) {
                this.saveDocument();
            }
        }, 1000);
    }

    private async saveDocument(): Promise<void> {
        if (!this.currentDocId || !this.editor) return;
        const json = this.editor.getJSON();
        await documentService.update(this.currentDocId, { content: json });
    }

    public async openDocument(id: string): Promise<void> {
        // Save previous doc if needed
        if (this.currentDocId) {
             await this.saveDocument();
        }

        // Clean up previous view
        this.destroy(); 
        // destroy() now handles both editors (unmountCanvas or destroy Tiptap)
        // Wait, current destroy() only destroys Tiptap. We need to update destroy() too.
        
        this.currentDocId = id;
        const doc = await documentService.getById(id);
        
        if (!doc) {
            // Handle 404
            return;
        }

        // Switch based on type
        if (doc.type === 'canvas') {
            await this.openCanvas(doc);
        } else {
            await this.openTiptap(doc);
        }
    }

    private async openCanvas(doc: any) {
        // dynamic import to avoid circular dep issues or loading React unnecessarily? 
        // Actually we can just import at top if we want, or dynamic import.
        const { mountCanvas } = await import('../components/mountCanvas');
        
        // Hide toolbar for canvas 
        if (this.toolbarEl) this.toolbarEl.style.display = 'none';
        
        // Ensure editor element is clean/ready
        this.editorEl.innerHTML = '';
        
        mountCanvas(this.editorEl, {
            initialContent: doc.content,
            onChange: (newContent: any) => {
                 this.handleCanvasChange(newContent);
            }
        });
    }

    private handleCanvasChange(content: any) {
        // We can reuse the same debounce logic or create a dedicated one.
        // For now, let's reuse scheduleSave? 
        // But scheduleSave relies on this.editor (Tiptap).
        // Let's make scheduleSave generic or just call update directly.
        
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            if (this.currentDocId) {
                await documentService.update(this.currentDocId, { content });
            }
        }, 1000);
    }

    private async openTiptap(doc: any) {
        const { createEditor } = await import('../editor');
        
        // Show toolbar
        if (this.toolbarEl) this.toolbarEl.style.display = 'flex';
        
        // Re-init Tiptap
        this.editor = createEditor(this.editorEl, this.toolbarEl);
        this.editor.commands.setContent(doc.content as any || '');
        this.editor.setEditable(true);
        
        this.editor.on('update', () => {
             this.scheduleSave();
        });
    }

    public async destroy(): Promise<void> {
        // Destroy Tiptap
        this.editor?.destroy();
        this.editor = null;

        // Unmount Canvas if active
        // dynamic import to avoid eager loading
        const { unmountCanvas } = await import('../components/mountCanvas');
        unmountCanvas();
        
        // Clear container
        if (this.editorEl) this.editorEl.innerHTML = '';
        
        // Reset toolbar state
        if (this.toolbarEl) this.toolbarEl.style.display = 'flex';
    }
}
