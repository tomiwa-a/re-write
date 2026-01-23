import { createEditor } from '../editor';
import { Editor } from '@tiptap/core';

export class EditorManager {
    private editor: Editor | null = null;
    private editorEl: HTMLElement;
    private toolbarEl: HTMLElement;

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
        }
    }

    public destroy(): void {
        this.editor?.destroy();
        this.editor = null;
    }
}
