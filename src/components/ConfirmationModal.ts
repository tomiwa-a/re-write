export interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void>;
}

export class ConfirmationModal {
    private overlay: HTMLElement;
    private options: ConfirmationOptions;

    constructor(options: ConfirmationOptions) {
        this.options = options;
        this.overlay = this.createOverlay();
    }

    public open(): void {
        document.body.appendChild(this.overlay);
        const confirmBtn = this.overlay.querySelector('#confirm-btn') as HTMLButtonElement;
        confirmBtn?.focus();
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

        const confirmClass = this.options.isDanger ? 'btn-danger' : 'btn-primary';

        overlay.innerHTML = `
            <div class="modal-card creation-modal">
                <div class="modal-header">
                    <h2 style="color: var(--text-primary); margin-top: 0;">${this.options.title}</h2>
                </div>
                
                <div class="modal-body">
                    <p style="color: var(--text-secondary); line-height: 1.5; margin: 0;">
                        ${this.options.message}
                    </p>
                </div>

                <div class="modal-footer">
                    <button class="btn-text" id="cancel-btn">${this.options.cancelText || 'Cancel'}</button>
                    <button class="${confirmClass}" id="confirm-btn">${this.options.confirmText || 'Confirm'}</button>
                </div>
            </div>
        `;

        const cancelBtn = overlay.querySelector('#cancel-btn');
        cancelBtn?.addEventListener('click', () => this.close());

        const confirmBtn = overlay.querySelector('#confirm-btn');
        const submit = async () => {
            const btn = confirmBtn as HTMLButtonElement;
            btn.disabled = true;
            btn.innerText = 'Processing...';
            try {
                await this.options.onConfirm();
                this.close();
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.innerText = this.options.confirmText || 'Confirm';
            }
        };
        confirmBtn?.addEventListener('click', submit);

        // Escape to close
        document.addEventListener('keydown', (e) => {
             if (e.key === 'Escape' && document.body.contains(overlay)) this.close();
        }, { once: true });

        return overlay;
    }
}
