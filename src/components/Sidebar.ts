export class Sidebar {
  private sections: NodeListOf<Element>;
  private folders: NodeListOf<Element>;

  constructor() {
    this.sections = document.querySelectorAll('.tree-section');
    this.folders = document.querySelectorAll('.tree-folder');
    this.init();
  }

  private init(): void {
    // Initialize section collapse/expand
    this.sections.forEach((section) => {
      const header = section.querySelector('.tree-header') as HTMLButtonElement;
      const content = section.querySelector('.tree-content') as HTMLElement;

      if (header && content) {
        // Set initial max-height for smooth transitions
        content.style.maxHeight = content.scrollHeight + 'px';

        header.addEventListener('click', () => {
          this.toggleSection(header, content);
        });
      }
    });

    // Initialize folder collapse/expand
    this.folders.forEach((folder) => {
      const header = folder.querySelector('.tree-folder-header') as HTMLElement;
      const items = folder.querySelector('.tree-folder-items') as HTMLElement;

      if (header && items) {
        // Set initial max-height for smooth transitions
        items.style.maxHeight = items.scrollHeight + 'px';

        header.addEventListener('click', () => {
          this.toggleFolder(folder as HTMLElement, items);
        });
      }
    });
  }

  private toggleSection(header: HTMLButtonElement, content: HTMLElement): void {
    const isCollapsed = header.classList.contains('collapsed');

    if (isCollapsed) {
      // Expand - toggle class first for immediate visual feedback
      header.classList.remove('collapsed');
      content.classList.remove('collapsed');
      // Use setTimeout to allow browser to register the class change
      setTimeout(() => {
        content.style.maxHeight = content.scrollHeight + 'px';
      }, 10);
    } else {
      // Collapse - toggle class first for immediate visual feedback
      header.classList.add('collapsed');
      content.style.maxHeight = '0';
      // Add collapsed class after animation starts
      setTimeout(() => {
        content.classList.add('collapsed');
      }, 10);
    }
  }

  private toggleFolder(folder: HTMLElement, items: HTMLElement): void {
    const isCollapsed = folder.classList.contains('collapsed');

    if (isCollapsed) {
      // Expand - toggle class first for immediate visual feedback
      folder.classList.remove('collapsed');
      setTimeout(() => {
        items.style.maxHeight = items.scrollHeight + 'px';
      }, 10);
    } else {
      // Collapse - toggle class first for immediate visual feedback
      folder.classList.add('collapsed');
      items.style.maxHeight = '0';
    }
  }

  public refresh(): void {
    // Recalculate max-heights after content changes
    this.sections.forEach((section) => {
      const content = section.querySelector('.tree-content') as HTMLElement;
      const header = section.querySelector('.tree-header') as HTMLButtonElement;
      
      if (content && header && !header.classList.contains('collapsed')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });

    this.folders.forEach((folder) => {
      const items = folder.querySelector('.tree-folder-items') as HTMLElement;
      
      if (items && !(folder as HTMLElement).classList.contains('collapsed')) {
        items.style.maxHeight = items.scrollHeight + 'px';
      }
    });
  }
}
