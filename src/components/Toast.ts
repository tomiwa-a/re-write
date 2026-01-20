/**
 * Toast Notification System
 * Displays temporary notifications with auto-dismiss
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  dismissible?: boolean;
}

export class Toast {
  private static container: HTMLElement | null = null;
  private element: HTMLElement;
  private timer: number | null = null;

  constructor(options: ToastOptions) {
    const {
      message,
      type = 'info',
      duration = 3000,
      dismissible = true,
    } = options;

    this.element = this.createToast(message, type, dismissible);
    this.show(duration);
  }

  private static getContainer(): HTMLElement {
    if (!Toast.container) {
      Toast.container = document.createElement('div');
      Toast.container.className = 'toast-container';
      document.body.appendChild(Toast.container);
    }
    return Toast.container;
  }

  private createToast(
    message: string,
    type: ToastType,
    dismissible: boolean
  ): HTMLElement {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = this.getIcon(type);
    const iconEl = document.createElement('span');
    iconEl.className = 'toast-icon';
    iconEl.innerHTML = icon;

    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;

    toast.appendChild(iconEl);
    toast.appendChild(messageEl);

    if (dismissible) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      closeBtn.onclick = () => this.dismiss();
      toast.appendChild(closeBtn);
    }

    return toast;
  }

  private getIcon(type: ToastType): string {
    const icons = {
      success: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `,
      error: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `,
      warning: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `,
      info: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      `,
    };
    return icons[type];
  }

  private show(duration: number): void {
    const container = Toast.getContainer();
    container.appendChild(this.element);

    // Trigger animation
    requestAnimationFrame(() => {
      this.element.classList.add('active');
    });

    // Auto-dismiss
    if (duration > 0) {
      this.timer = window.setTimeout(() => this.dismiss(), duration);
    }
  }

  public dismiss(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.element.classList.remove('active');

    setTimeout(() => {
      this.element.remove();
    }, 200); // Match CSS transition duration
  }

  // Static helper methods
  public static success(message: string, duration?: number): Toast {
    return new Toast({ message, type: 'success', duration });
  }

  public static error(message: string, duration?: number): Toast {
    return new Toast({ message, type: 'error', duration });
  }

  public static info(message: string, duration?: number): Toast {
    return new Toast({ message, type: 'info', duration });
  }

  public static warning(message: string, duration?: number): Toast {
    return new Toast({ message, type: 'warning', duration });
  }
}
