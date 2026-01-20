/**
 * Reusable Modal Component
 * Provides a base modal with backdrop, animations, and keyboard support
 */

export interface ModalOptions {
  title?: string;
  content?: string | HTMLElement;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  width?: string;
  onClose?: () => void;
}

export class Modal {
  private backdrop: HTMLElement;
  private modal: HTMLElement;
  private options: ModalOptions;

  constructor(options: ModalOptions = {}) {
    this.options = {
      showCloseButton: true,
      closeOnBackdrop: true,
      closeOnEscape: true,
      width: "500px",
      ...options,
    };

    this.backdrop = this.createBackdrop();
    this.modal = this.createModal();
    this.attachEventListeners();
  }

  private createBackdrop(): HTMLElement {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    return backdrop;
  }

  private createModal(): HTMLElement {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.width = this.options.width || "500px";

    // Header
    if (this.options.title || this.options.showCloseButton) {
      const header = document.createElement("div");
      header.className = "modal-header";

      if (this.options.title) {
        const title = document.createElement("h2");
        title.className = "modal-title";
        title.textContent = this.options.title;
        header.appendChild(title);
      }

      if (this.options.showCloseButton) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "modal-close";
        closeBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        closeBtn.onclick = () => this.close();
        header.appendChild(closeBtn);
      }

      modal.appendChild(header);
    }

    // Body
    const body = document.createElement("div");
    body.className = "modal-body";

    if (typeof this.options.content === "string") {
      body.innerHTML = this.options.content;
    } else if (this.options.content instanceof HTMLElement) {
      body.appendChild(this.options.content);
    }

    modal.appendChild(body);

    return modal;
  }

  private attachEventListeners(): void {
    // Close on backdrop click
    if (this.options.closeOnBackdrop) {
      this.backdrop.addEventListener("click", (e) => {
        if (e.target === this.backdrop) {
          this.close();
        }
      });
    }

    // Close on ESC key
    if (this.options.closeOnEscape) {
      document.addEventListener("keydown", this.handleEscapeKey);
    }
  }

  private handleEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      this.close();
    }
  };

  public open(): void {
    document.body.appendChild(this.backdrop);
    this.backdrop.appendChild(this.modal);

    // Trigger animation
    requestAnimationFrame(() => {
      this.backdrop.classList.add("active");
      this.modal.classList.add("active");
    });

    // Prevent body scroll
    document.body.style.overflow = "hidden";
  }

  public close(): void {
    this.backdrop.classList.remove("active");
    this.modal.classList.remove("active");

    setTimeout(() => {
      this.backdrop.remove();
      document.body.style.overflow = "";
      document.removeEventListener("keydown", this.handleEscapeKey);

      if (this.options.onClose) {
        this.options.onClose();
      }
    }, 200); // Match CSS transition duration
  }

  public getBody(): HTMLElement {
    return this.modal.querySelector(".modal-body") as HTMLElement;
  }

  public setContent(content: string | HTMLElement): void {
    const body = this.getBody();
    body.innerHTML = "";

    if (typeof content === "string") {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    }
  }
}
