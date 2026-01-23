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
            
            // Auto-save on update
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
        }, 1000); // Debounce 1s
    }

    private async saveDocument(): Promise<void> {
        if (!this.currentDocId || !this.editor) return;
        const json = this.editor.getJSON();
        await documentService.update(this.currentDocId, { content: json });
        // Optional: Show saving indicator
    }

    public async openDocument(id: string): Promise<void> {
        // Save previous if needed?
        if (this.currentDocId) {
             await this.saveDocument();
        }

        this.currentDocId = id;
        const doc = await documentService.getById(id);
        console.log('Opening Document:', id, doc);
        
        if (doc && this.editor) {
            console.log('Setting Content:', doc.content);
            // Set content
            // If doc.content is null/undefined, set empty?
            this.editor.commands.setContent(doc.content as any || '');
            this.editor.setEditable(true);
            
            // Update UI/Title?
            // Maybe emit event
        } else {
             this.editor?.setEditable(false);
             this.editor?.commands.setContent('Document not found');
        }
    }

    public destroy(): void {
        this.editor?.destroy();
        this.editor = null;
    }
}
