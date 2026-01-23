import { Category, SidebarItem } from '../types/frontend';
import { INITIAL_CATEGORIES } from '../data/categories';
import { folderService } from '../lib/folders';
import { Folder, Document } from '../types/backend';
import { Toast } from '../components/Toast';
import { ContextMenu, ContextMenuItem } from '../components/ContextMenu';

import { FileIcon as IconFile } from '../assets/icons/file';
import { FolderIcon as IconFolder, FolderOpenIcon as IconFolderOpen } from '../assets/icons/folder';
import { ChevronIcon as IconChevron } from '../assets/icons/chevron';
import { FilePlusIcon as IconFilePlus } from '../assets/icons/file-plus';
import { FolderPlusIcon as IconFolderPlus } from '../assets/icons/folder-plus';


const CURRENT_USER_ID = 'local-user';

export class SidebarManager {
    private categories: Category[] = INITIAL_CATEGORIES;

    constructor() {
        // Initialization handled by App
    }

    public async loadData(): Promise<void> {
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

    public async init(): Promise<void> {
        this.setupSidebarContextMenu();
        await this.loadData();
        // this.renderSidebar();
    }

    private setupSidebarContextMenu(): void {
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
                    ${IconChevron}
                  </div>
                  <div style="display: flex; align-items: center; margin-right: 8px;">
                     ${category.icon || ''}
                  </div>
                  <span class="category-title">${category.title}</span>
                </div>
                <div class="category-actions">
                  ${category.actions?.newFile ? `
                    <button title="New File" class="action-btn" data-action="new-file">
                       ${IconFilePlus}
                    </button>
                  ` : ''}
                  ${category.actions?.newFolder ? `
                    <button title="New Folder" class="action-btn" data-action="new-folder">
                       ${IconFolderPlus}
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
             html += `
              <div class="tree-item folder" data-id="${item.id}" style="padding-left: ${paddingLeft}px">
                 <span class="folder-icon">${isExpanded ? IconFolderOpen : IconFolder}</span>
                 <span>${item.title}</span>
              </div>
              ${isExpanded && item.children ? this.renderItems(item.children, level + 1) : ''}
             `;
          } else {
             html += `
              <div class="tree-item file" data-id="${item.id}" style="padding-left: ${paddingLeft}px">
                 <span class="file-icon">${IconFile}</span>
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

    private createNewNote(): void {
        Toast.success('Creating new note (TODO)');
    }

    // Context Menu Helpers
    private showCategoryContextMenu(e: MouseEvent): void {
        const menuItems: ContextMenuItem[] = [
          { label: 'New File', icon: IconFilePlus, action: () => this.createNewNote() },
          { label: 'New Folder', icon: IconFolderPlus, action: () => this.createNewFolder() }
        ];
        ContextMenu.show(menuItems, e.clientX, e.clientY);
    }

    private showFolderContextMenu(e: MouseEvent, header: HTMLElement): void {
        const folderName = header.querySelector('span')?.textContent || 'Folder';
        const menuItems: ContextMenuItem[] = [
            { label: 'New File', icon: IconFilePlus, action: () => this.createNewNote() },
            { label: 'New Folder', icon: IconFolderPlus, action: () => this.createNewFolder() },
            { divider: true, label: '', action: () => {} },
            { label: 'Rename', icon: '', action: () => Toast.info(`Renaming ${folderName}`) }, 
            // Simplified icons for brevity, can re-add full SVGs if needed or import
             { divider: true, label: '', action: () => {} },
            { label: 'Delete', icon: '', action: () => Toast.error(`${folderName} deleted`), danger: true },
        ];
        ContextMenu.show(menuItems, e.clientX, e.clientY);
    }

    private showNoteContextMenu(e: MouseEvent, item: HTMLElement): void {
        const noteName = item.querySelector('span')?.textContent || 'Note';
        const menuItems: ContextMenuItem[] = [
            { label: 'Open', icon: '', action: () => Toast.info(`Opening ${noteName}`) },
             { divider: true, label: '', action: () => {} },
            { label: 'Delete', icon: '', action: () => Toast.error(`${noteName} deleted`), danger: true },
        ];
        ContextMenu.show(menuItems, e.clientX, e.clientY);
    }
}
