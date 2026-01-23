/**
 * Context Menu Component
 * Displays a right-click menu with customizable options
 */

export interface ContextMenuItem {
  label: string;
  icon?: string;
  action: () => void;
  divider?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export class ContextMenu {
  private menu: HTMLElement;
  private items: ContextMenuItem[];

  constructor(items: ContextMenuItem[]) {
    this.items = items;
    this.menu = this.createMenu();
    setTimeout(() => this.attachEventListeners(), 0);
  }

  private createMenu(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'context-menu';

    this.items.forEach((item) => {
      if (item.divider) {
        const divider = document.createElement('div');
        divider.className = 'context-menu-divider';
        menu.appendChild(divider);
        return;
      }

      const menuItem = document.createElement('button');
      menuItem.className = 'context-menu-item';

      if (item.danger) {
        menuItem.classList.add('danger');
      }

      if (item.disabled) {
        menuItem.classList.add('disabled');
        menuItem.disabled = true;
      }

      if (item.icon) {
        const icon = document.createElement('span');
        icon.className = 'context-menu-icon';
        icon.innerHTML = item.icon;
        menuItem.appendChild(icon);
      }

      const label = document.createElement('span');
      label.textContent = item.label;
      menuItem.appendChild(label);

      if (!item.disabled) {
        menuItem.onclick = () => {
          item.action();
          this.close();
        };
      }

      menu.appendChild(menuItem);
    });

    return menu;
  }

  private attachEventListeners(): void {
    // Close on click outside
    document.addEventListener('click', this.handleClickOutside);
    document.addEventListener('contextmenu', this.handleClickOutside);

    // Close on ESC
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  private handleClickOutside = (e: Event): void => {
    if (!this.menu.contains(e.target as Node)) {
      this.close();
    }
  };

  private handleEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  public show(x: number, y: number): void {
    document.body.appendChild(this.menu);

    // Position the menu
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;

    // Adjust position if menu goes off-screen
    requestAnimationFrame(() => {
      const rect = this.menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        this.menu.style.left = `${viewportWidth - rect.width - 10}px`;
      }

      if (rect.bottom > viewportHeight) {
        this.menu.style.top = `${viewportHeight - rect.height - 10}px`;
      }

      this.menu.classList.add('active');
    });
  }

  public close(): void {
    this.menu.classList.remove('active');

    setTimeout(() => {
      this.menu.remove();
      document.removeEventListener('click', this.handleClickOutside);
      document.removeEventListener('contextmenu', this.handleClickOutside);
      document.removeEventListener('keydown', this.handleEscapeKey);
    }, 150); // Match CSS transition duration
  }

  // Static helper to create and show context menu
  public static show(
    items: ContextMenuItem[],
    x: number,
    y: number
  ): ContextMenu {
    const menu = new ContextMenu(items);
    menu.show(x, y);
    return menu;
  }
}
