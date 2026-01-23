import './styles/app.css';
import './styles/components.css';
import './styles/share-modal.css';
import './styles/editor.css';
import { ShareModal } from './components/ShareModal';
import { Toast } from './components/Toast';
import { folderService } from './lib/folders';
import { documentService } from './lib/documents';
import { Folder, Document } from './types/backend';

const CURRENT_USER_ID = 'local-user';
import { ContextMenu, ContextMenuItem } from './components/ContextMenu';
import { createEditor } from './editor';
import type { Editor } from '@tiptap/core';

import { Category, SidebarItem } from './types/frontend';
import { INITIAL_CATEGORIES } from './data/categories';
import { FileIcon } from './assets/icons/file';
import { FolderIcon, FolderOpenIcon } from './assets/icons/folder';
import { ChevronIcon } from './assets/icons/chevron';
import { FilePlusIcon } from './assets/icons/file-plus';
import { FolderPlusIcon } from './assets/icons/folder-plus';
import { CloudCheckIcon } from './assets/icons/cloud';
import { GlobeIcon } from './assets/icons/globe';
import { ClockIcon } from './assets/icons/clock';



class App {
  private editor: Editor | null = null;
  private categories: Category[] = INITIAL_CATEGORIES;

  constructor() {
    this.init();
    this.loadData();
  }

  private async loadData(): Promise<void> {
      try {
          const folders = await folderService.getAll();
          const documents: Document[] = [];

          const notesCategory = this.categories.find(c => c.id === 'notes');
          if (notesCategory) {
              notesCategory.items = this.mapData(folders, documents);
          }
          this.renderSidebar();
      } catch (error) {
          console.error("Failed to load data:", error);
          Toast.error("Failed to load folders");
      }
  }

  private mapData(folders: Folder[], documents: Document[]): SidebarItem[] {
      const itemMap = new Map<string, SidebarItem>();
      const rootItems: SidebarItem[] = [];

      // Process Folders
      folders.forEach(folder => {
          const item: SidebarItem = {
              id: folder.id,
              title: folder.name,
              type: 'folder',
              parentId: folder.parentId,
              children: [],
              collapsed: true
          };
          itemMap.set(folder.id, item);
      });

      // Build Tree
      folders.forEach(folder => {
          const item = itemMap.get(folder.id)!;
          if (folder.parentId && itemMap.has(folder.parentId)) {
              const parent = itemMap.get(folder.parentId)!;
              parent.children = parent.children || [];
              parent.children.push(item);
          } else {
              rootItems.push(item);
          }
      });
      return rootItems;
  }

  private init(): void {
    this.setupEditor();
    this.setupEventListeners();
    this.setupSidebar(); // Context menu
    this.setupAvatarDropdown();
    this.renderSidebar(); 
    this.renderRightPane();
  }

  private renderRightPane(): void {
     // Sync Status
     const syncCard = document.getElementById('sync-status-card');
     if (syncCard) {
         syncCard.innerHTML = `
             <div class="status-item">
                 <div class="status-icon success">${CloudCheckIcon}</div>
                 <div class="status-info">
                     <span class="status-label">Sync Status</span>
                     <span class="status-value">Synced just now</span>
                 </div>
             </div>
             <div class="status-item">
                 <div class="status-icon success">${GlobeIcon}</div>
                 <div class="status-info">
                     <span class="status-label">Connection</span>
                     <span class="status-value">Online</span>
                 </div>
             </div>
         `;
     }

     // Share Card
     const shareCard = document.getElementById('share-card');
     if (shareCard) {
         shareCard.innerHTML = `
             <div class="share-info">
                 <p class="share-status">Private Only you</p>
             </div>
             <button class="btn-share-large" id="right-pane-share-btn">
                 Share Document
             </button>
         `;
         
         const btn = document.getElementById('right-pane-share-btn');
         btn?.addEventListener('click', () => {
             const modal = new ShareModal();
             modal.open();
         });
     }

     // History List
     const historyList = document.getElementById('history-list');
     if (historyList) {
         const versions = [
             { time: 'Just now', author: 'You', type: 'current' },
             { time: '2 hours ago', author: 'You', type: 'save' },
             { time: 'Yesterday', author: 'You', type: 'save' },
         ];
         
         historyList.innerHTML = versions.map((v, i) => `
             <div class="history-item ${v.type === 'current' ? 'active' : ''}">
                 <div class="history-icon">${ClockIcon}</div>
                 <div class="history-details">
                     <span class="history-author">${v.author}</span>
                     <span class="history-time">${v.time}</span>
                 </div>
             </div>
         `).join('');
     }
  }

  private setupEditor(): void {
    const toolbarEl = document.getElementById('editor-toolbar') as HTMLElement;
    const editorEl = document.getElementById('editor-content') as HTMLElement;
    if (toolbarEl && editorEl) {
      this.editor = createEditor(editorEl, toolbarEl);
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

    const miniNoteBtn = document.getElementById('new-note-btn-mini');
    if (miniNoteBtn) {
      miniNoteBtn.addEventListener('click', () => {
        this.createNewNote();
      });
    }

    // Category Actions
    document.querySelectorAll('.action-btn[title="New Note"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.createNewNote();
      });
    });

    document.querySelectorAll('.action-btn[title="New Folder"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.createNewFolder();
      });
    });

    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebarTrigger = document.querySelector('.sidebar-trigger');

    if (sidebar) {
      if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
          sidebar.classList.toggle('collapsed');
        });
      }

      if (sidebarTrigger) {
        sidebarTrigger.addEventListener('click', () => {
    });
  }}


  }

  private setupSidebar(): void {
    const sidebar = document.querySelector('.sidebar-tree');
    if (sidebar) {
      sidebar.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        
        const treeItem = target.closest('.tree-item');
        if (treeItem) {
          if (treeItem.classList.contains('folder')) {
             this.showFolderContextMenu(e as MouseEvent, treeItem as HTMLElement);
          } else {
             this.showNoteContextMenu(e as MouseEvent, treeItem as HTMLElement);
          }
          return;
        }
        
        const treeHeader = target.closest('.tree-header');
        if (treeHeader) {
          this.showCategoryContextMenu(e as MouseEvent);
          return;
        }
      });
    }
  }


  private setupAvatarDropdown(): void {
    const avatarBtn = document.getElementById('user-avatar-btn');
    const dropdown = document.getElementById('avatar-dropdown');

    if (avatarBtn && dropdown) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!avatarBtn.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
          dropdown.classList.remove('show');
        }
      });
    }
  }

  private createNewNote(): void {
    Toast.success('Creating new note...');
    // TODO: Implement actual note creation
  }

  private async createNewFolder(): Promise<void> {
    const name = prompt('Folder Name:', 'New Folder');
    if (!name) return;

    try {
        await folderService.create({
            name: name,
            userId: CURRENT_USER_ID,
        });
        await this.loadData();
        Toast.success('Folder created');
    } catch (err) {
        console.error(err);
        Toast.error('Failed to create folder');
    }
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


  private showCategoryContextMenu(e: MouseEvent): void {
    const menuItems: ContextMenuItem[] = [
      {
        label: 'New File',
        icon: FilePlusIcon,
        action: () => this.createNewNote(),
      },
      {
        label: 'New Folder',
        icon: FolderPlusIcon,
        action: () => this.createNewFolder(),
      }
    ];

    ContextMenu.show(menuItems, e.clientX, e.clientY);
  }

  private showFolderContextMenu(e: MouseEvent, header: HTMLElement): void {
    const folderName = header.querySelector('span')?.textContent || 'Folder';

    const menuItems: ContextMenuItem[] = [
      {
        label: 'New File',
        icon: FilePlusIcon,
        action: () => this.createNewNote(),
      },
      {
        label: 'New Folder',
        icon: FolderPlusIcon,
        action: () => this.createNewFolder(),
      },
      { divider: true, label: '', action: () => {} },
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
  private renderSidebar(): void {
    const root = document.getElementById('sidebar-tree-root');
    if (!root) return;

    let html = '';
    
    this.categories.forEach(category => {
      const isExpanded = !category.collapsed;
      const chevronRotation = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
      const displayItems = isExpanded ? 'block' : 'none';

      html += `
        <div class="tree-category ${isExpanded ? 'expanded' : ''}" data-category-id="${category.id}">
          <div class="category-header">
            <div class="header-content">
              <div style="display: flex; align-items: center; transform: ${chevronRotation}" class="chevron-container">
                ${ChevronIcon}
              </div>
              <div style="display: flex; align-items: center; margin-right: 8px;">
                 ${category.icon || ''}
              </div>
              <span class="category-title">${category.title}</span>
            </div>
            <div class="category-actions">
              ${category.actions?.newFile ? `
                <button title="New File" class="action-btn" data-action="new-file">
                   ${FilePlusIcon}
                </button>
              ` : ''}
              ${category.actions?.newFolder ? `
                <button title="New Folder" class="action-btn" data-action="new-folder">
                   ${FolderPlusIcon}
                </button>
              ` : ''}
            </div>
          </div>
          <div class="category-items" style="display: ${displayItems}">
            ${this.renderItems(category.items)}
          </div>
        </div>
        <div class="sidebar-divider"></div>
      `;
    });

    root.innerHTML = html;
    this.attachSidebarListeners();
  }

  private renderItems(items: SidebarItem[], level = 0): string {
    let html = '';
    items.forEach(item => {
      const paddingLeft = 16 + (level * 12); 
      
      if (item.type === 'folder') {
         const isExpanded = !item.collapsed;
         // Folder logic
         html += `
          <div class="tree-item folder" data-id="${item.id}" style="padding-left: ${paddingLeft}px">
             <span class="folder-icon">${isExpanded ? FolderOpenIcon : FolderIcon}</span>
             <span>${item.title}</span>
          </div>
          ${isExpanded && item.children ? this.renderItems(item.children, level + 1) : ''}
         `;
      } else {
         html += `
          <div class="tree-item file" data-id="${item.id}" style="padding-left: ${paddingLeft}px">
             <span class="file-icon">${FileIcon}</span>
             <span>${item.title}</span>
          </div>
         `;
      }
    });
    return html;
  }

  private attachSidebarListeners(): void {
      document.querySelectorAll('.category-header').forEach(header => {
          header.addEventListener('click', (e) => {
              if ((e.target as HTMLElement).closest('.action-btn')) return;
              const catId = header.closest('.tree-category')?.getAttribute('data-category-id');
              if (catId) this.toggleCategory(catId);
          });
      });

      document.querySelectorAll('.action-btn[data-action="new-file"]').forEach(btn => {
          btn.addEventListener('click', (e) => { e.stopPropagation(); this.createNewNote(); });
      });
      document.querySelectorAll('.action-btn[data-action="new-folder"]').forEach(btn => {
          btn.addEventListener('click', (e) => { e.stopPropagation(); this.createNewFolder(); });
      });

      document.querySelectorAll('.tree-item.folder').forEach(folder => {
        folder.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = folder.getAttribute('data-id');
            if (id) this.toggleFolder(id);
        });
      });
  }

  private toggleCategory(id: string): void {
      const cat = this.categories.find(c => c.id === id);
      if (cat) {
          cat.collapsed = !cat.collapsed;
          this.renderSidebar();
      }
  }

  private toggleFolder(id: string): void {
     this.categories.forEach(cat => {
         const folder = this.findItem(cat.items, id);
         if (folder) {
             folder.collapsed = !folder.collapsed;
             this.renderSidebar();
         }
     });
  }

  private findItem(items: SidebarItem[], id: string): SidebarItem | null {
      for (const item of items) {
          if (item.id === id) return item;
          if (item.children) {
              const found = this.findItem(item.children, id);
              if (found) return found; 
          }
      }
      return null;
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
