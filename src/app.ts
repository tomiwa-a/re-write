import './styles/app.css';
import './styles/components.css';
import './styles/share-modal.css';
import './styles/editor.css';
import { ShareModal } from './components/ShareModal';
import { Toast } from './components/Toast';
import { ContextMenu, ContextMenuItem } from './components/ContextMenu';
import { initEditor, getEditor } from './editor';
import type { Editor } from '@tiptap/core';

class App {
  private editor: Editor | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.setupEditor();
    this.setupEventListeners();
    this.setupSidebar();
    this.setupToolbar();
  }

  private setupEditor(): void {
    const editorEl = document.querySelector('.editor') as HTMLElement;
    if (editorEl) {
      editorEl.removeAttribute('contenteditable');
      editorEl.removeAttribute('data-placeholder');
      editorEl.innerHTML = '';
      this.editor = initEditor(editorEl);
    }
  }

  private setupEventListeners(): void {
    const shareBtn = document.querySelector('.toolbar-action:has(svg path[d*="M4 12v8"])') as HTMLButtonElement;
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const modal = new ShareModal();
        modal.open();
      });
    }

    const saveBtn = document.querySelector('.toolbar-action:has(svg path[d*="M19 21H5"])') as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        Toast.success('Note saved successfully!');
      });
    }

    const newNoteBtn = document.getElementById('new-note-btn');
    if (newNoteBtn) {
      newNoteBtn.addEventListener('click', () => {
        this.createNewNote();
      });
    }

    const newFolderBtn = document.getElementById('new-folder-btn');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => {
        this.createNewFolder();
      });
    }

    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
  }

  private setupSidebar(): void {
    const sidebar = document.querySelector('.sidebar-tree');
    if (sidebar) {
      sidebar.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        
        const treeItem = target.closest('.tree-item');
        if (treeItem) {
          this.showNoteContextMenu(e as MouseEvent, treeItem as HTMLElement);
          return;
        }
        
        const treeHeader = target.closest('.tree-header');
        if (treeHeader) {
          this.showFolderContextMenu(e as MouseEvent, treeHeader as HTMLElement);
          return;
        }
      });
    }
  }

  private setupToolbar(): void {
    const editor = getEditor();
    if (!editor) return;

    const toolbarBtns = document.querySelectorAll('.toolbar-btn');
    toolbarBtns.forEach((btn) => {
      const title = btn.getAttribute('title');
      btn.addEventListener('click', () => {
        switch (title) {
          case 'Bold':
            editor.chain().focus().toggleBold().run();
            break;
          case 'Italic':
            editor.chain().focus().toggleItalic().run();
            break;
          case 'Underline':
            break;
          case 'Heading 1':
            editor.chain().focus().toggleHeading({ level: 1 }).run();
            break;
          case 'Heading 2':
            editor.chain().focus().toggleHeading({ level: 2 }).run();
            break;
          case 'Heading 3':
            editor.chain().focus().toggleHeading({ level: 3 }).run();
            break;
          case 'Bullet List':
            editor.chain().focus().toggleBulletList().run();
            break;
          case 'Numbered List':
            editor.chain().focus().toggleOrderedList().run();
            break;
          case 'Checklist':
            break;
        }
      });
    });
  }

  private createNewNote(): void {
    Toast.success('Creating new note...');
    // TODO: Implement actual note creation
  }

  private createNewFolder(): void {
    Toast.success('Creating new folder...');
    // TODO: Implement actual folder creation
  }

  private showNoteContextMenu(e: MouseEvent, item: HTMLElement): void {
    const noteName = item.querySelector('span')?.textContent || 'Note';

    const menuItems: ContextMenuItem[] = [
      {
        label: 'Open in new tab',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
        action: () => Toast.info(`Opening ${noteName} in new tab`),
      },
      {
        label: 'Rename',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
        action: () => Toast.info(`Renaming ${noteName}`),
      },
      {
        label: 'Duplicate',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        action: () => Toast.success(`${noteName} duplicated`),
      },
      {
        label: 'Move to folder',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
        action: () => Toast.info('Select destination folder'),
      },
      { divider: true, label: '', action: () => {} },
      {
        label: 'Add to favorites',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        action: () => Toast.success(`${noteName} added to favorites`),
      },
      {
        label: 'Share',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>`,
        action: () => {
          const modal = new ShareModal();
          modal.open();
        },
      },
      {
        label: 'Export',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
        action: () => Toast.info('Export options'),
      },
      { divider: true, label: '', action: () => {} },
      {
        label: 'Delete',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        action: () => Toast.error(`${noteName} deleted`),
        danger: true,
      },
    ];

    ContextMenu.show(menuItems, e.clientX, e.clientY);
  }

  private showFolderContextMenu(e: MouseEvent, header: HTMLElement): void {
    const folderName = header.querySelector('span')?.textContent || 'Folder';

    const menuItems: ContextMenuItem[] = [
      {
        label: 'Rename',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
        action: () => Toast.info(`Renaming ${folderName}`),
      },
      {
        label: 'Change color',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 0 0 20"></path></svg>`,
        action: () => Toast.info('Select folder color'),
      },
      {
        label: 'Add subfolder',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>`,
        action: () => Toast.success('Creating subfolder...'),
      },
      { divider: true, label: '', action: () => {} },
      {
        label: 'Delete',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        action: () => Toast.error(`${folderName} deleted`),
        danger: true,
      },
    ];

    ContextMenu.show(menuItems, e.clientX, e.clientY);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
