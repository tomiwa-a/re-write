import { DocumentType } from '../types/backend';
import { FolderIcon } from '../assets/icons/folder';
import { CanvasIcon } from '../assets/icons/canvas';
import { NotesIcon } from '../assets/icons/notes';
import { ERDIcon } from '../assets/icons/erd';

interface CreationOptions {
    type: 'folder' | 'file';
    mode: 'create' | 'rename';
    fileType: DocumentType;
    parentId?: string;
    initialValue?: string;
    onConfirm: (name: string, type: DocumentType) => Promise<void>;
}

export class CreationModal {
    private overlay: HTMLElement;
    private options: CreationOptions;

    constructor(options: CreationOptions) {
        this.options = options;
        this.overlay = this.createOverlay();
    }

    public open(): void {
        document.body.appendChild(this.overlay);
        const input = this.overlay.querySelector('input');
        if (input) {
            input.focus();
            input.select(); // Select all text for renaming convenience
        }
    }

    public close(): void {
        this.overlay.remove();
    }

    private createOverlay(): HTMLElement {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        const icon = this.getIcon(this.options.fileType);
        const title = this.getTitle();
        const btnText = this.options.mode === 'create' ? 'Create' : 'Save';
        const placeholder = this.options.mode === 'create' ? `Untitled ${this.getLabel()}` : 'Name';
        const initialValue = this.options.initialValue || (this.options.mode === 'create' ? `Untitled ${this.getLabel()}` : '');

        overlay.innerHTML = `
            <div class="modal-card creation-modal">
                <div class="modal-header">
                    <div class="creation-icon-badge">
                        ${icon}
                    </div>
                    <h2>${title}</h2>
                </div>
                
                <div class="modal-body">
                    <div class="input-group">
                        <input type="text" placeholder="${placeholder}" class="creation-input" value="${initialValue}">
                    </div>
                    
                    <div class="warning-text" style="display: none; color: var(--danger); font-size: 0.8rem; margin-top: 8px;">
                        Name cannot be empty
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-text" id="cancel-btn">Cancel</button>
                    <button class="btn-primary" id="create-btn">${btnText}</button>
                </div>
            </div>
        `;

        const cancelBtn = overlay.querySelector('#cancel-btn');
        cancelBtn?.addEventListener('click', () => this.close());

        const createBtn = overlay.querySelector('#create-btn');
        const input = overlay.querySelector('input') as HTMLInputElement;

        const submit = async () => {
            const name = input.value.trim();
            if (!name) {
                const warn = overlay.querySelector('.warning-text') as HTMLElement;
                if (warn) warn.style.display = 'block';
                return;
            }

            const btn = createBtn as HTMLButtonElement;
            btn.disabled = true;
            btn.innerText = 'Saving...';

            try {
                await this.options.onConfirm(name, this.options.fileType);
                this.close();
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.innerText = btnText;
            }
        };

        createBtn?.addEventListener('click', submit);
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') this.close();
        });

        return overlay;
    }

    private getIcon(type: DocumentType): string {
        if (this.options.type === 'folder') return FolderIcon;
        switch (type) {
            case 'canvas': return CanvasIcon;
            case 'erd': return ERDIcon;
            default: return NotesIcon;
        }
    }

    private getTitle(): string {
        const typeLabel = this.options.fileType === 'erd' ? 'Relationship' : 
                          this.options.fileType.charAt(0).toUpperCase() + this.options.fileType.slice(1);
        
        const entity = this.options.type === 'folder' ? 'Folder' : typeLabel;
        
        // e.g. "New Canvas" or "Rename Folder" (simplification)
        if (this.options.mode === 'rename') return `Rename ${entity}`;
        if (this.options.type === 'folder') return `New ${typeLabel} Folder`;
        return `New ${typeLabel}`;
    }

    private getLabel(): string {
        const typeLabel = this.options.fileType === 'erd' ? 'Relationship' : 
                          this.options.fileType.charAt(0).toUpperCase() + this.options.fileType.slice(1);
        return this.options.type === 'folder' ? 'Folder' : typeLabel;
    }
}
