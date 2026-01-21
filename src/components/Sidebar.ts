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
        header.addEventListener('click', () => {
          this.toggleSection(header, content);
        });
      }
    });

    // Initialize folder collapse/expand
    this.folders.forEach((folder) => {
      const header = folder.querySelector('.tree-folder-header') as HTMLElement;

      if (header) {
        header.addEventListener('click', () => {
          this.toggleFolder(folder as HTMLElement);
        });
      }
    });
  }

  private toggleSection(header: HTMLButtonElement, content: HTMLElement): void {
    const isCollapsed = header.classList.contains('collapsed');

    if (isCollapsed) {
      // Expand
      header.classList.remove('collapsed');
      content.classList.remove('collapsed');
    } else {
      // Collapse
      header.classList.add('collapsed');
      content.classList.add('collapsed');
    }
  }

  private toggleFolder(folder: HTMLElement): void {
    const isCollapsed = folder.classList.contains('collapsed');

    if (isCollapsed) {
      // Expand
      folder.classList.remove('collapsed');
    } else {
      // Collapse
      folder.classList.add('collapsed');
    }
  }

  public refresh(): void {
    // No need to recalculate max-heights anymore since we use CSS
  }
}
