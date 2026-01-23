import { Category, SidebarItem } from '../types/frontend';
import { INITIAL_CATEGORIES } from '../data/categories';
import { folderService } from '../lib/folders';
import { documentService } from '../lib/documents';
import { Folder, Document } from '../types/backend';
import { Toast } from '../components/Toast';
import { ContextMenu, ContextMenuItem } from '../components/ContextMenu';

import { FileIcon as IconFile } from '../assets/icons/file';
import { FolderIcon as IconFolder, FolderOpenIcon as IconFolderOpen } from '../assets/icons/folder';
import { ChevronIcon as IconChevron } from '../assets/icons/chevron';
import { FilePlusIcon as IconFilePlus } from '../assets/icons/file-plus';
import { FolderPlusIcon as IconFolderPlus } from '../assets/icons/folder-plus';
import { CreationModal } from '../components/CreationModal';
import { DocumentType } from '../types/backend';


const CURRENT_USER_ID = 'local-user';

export class SidebarManager {
    private categories: Category[] = INITIAL_CATEGORIES;

    constructor() {
        // Initialization handled by App
    }

    public async loadData(): Promise<void> {
        try {
            const folders = await folderService.getAll();
            const documents = await documentService.getAll();
  
            const notesCategory = this.categories.find(c => c.id === 'notes');
            if (notesCategory) {
                notesCategory.items = this.mapData(folders, documents);
            }
            // Future: Canvas/ERD category mapping
            
            this.renderSidebar();
        } catch (error) {
            console.error("Failed to load data:", error);
            Toast.error("Failed to load data");
        }
    }
  
    private mapData(folders: Folder[], documents: Document[]): SidebarItem[] {
        const itemMap = new Map<string, SidebarItem>();
        const rootItems: SidebarItem[] = [];
  
        // 1. Map Folders
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

        // 2. Map Documents
        documents.forEach(doc => {
            const item: SidebarItem = {
                id: doc.id,
                title: doc.title,
                type: doc.type, 
                parentId: doc.folderId,
                children: [], // Files don't have children but interface needs it
            };
            itemMap.set(doc.id, item);
        });
  
        // 3. Build Tree (Folders)
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

        // 4. Build Tree (Documents)
        documents.forEach(doc => {
             const item = itemMap.get(doc.id)!;
             if (doc.folderId && itemMap.has(doc.folderId)) {
                 const parent = itemMap.get(doc.folderId)!;
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
            btn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                // Determine type from category
                 const catId = btn.closest('.tree-category')?.getAttribute('data-category-id');
                 let type: DocumentType = 'note';
                 if (catId === 'canvas') type = 'canvas';
                 if (catId === 'erd') type = 'erd';
                this.createNewNote(type); 
            });
        });
        document.querySelectorAll('.action-btn[data-action="new-folder"]').forEach(btn => {
            btn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                // Determine type from category
                 const catId = btn.closest('.tree-category')?.getAttribute('data-category-id');
                 let type: DocumentType = 'note';
                 if (catId === 'canvas') type = 'canvas';
                 if (catId === 'erd') type = 'erd';
                this.createNewFolder(type); 
            });
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

    private async createNewFolder(contextType: DocumentType = 'note', parentId?: string): Promise<void> {
        const modal = new CreationModal({
            type: 'folder',
            mode: 'create',
            fileType: contextType,
            parentId: parentId,
            onConfirm: async (name, type) => {
                await folderService.create({
                    name: name,
                    type: type,
                    userId: CURRENT_USER_ID,
                    parentId: parentId
                });
                await this.loadData();
                Toast.success(`Created ${type} folder`);
            }
        });
        modal.open();
    }

    private createNewNote(contextType: DocumentType = 'note', parentId?: string): void {
        const modal = new CreationModal({
            type: 'file',
            mode: 'create',
            fileType: contextType,
            parentId: parentId,
            onConfirm: async (name, type) => {
                await documentService.create({
                    title: name,
                    type: type,
                    userId: CURRENT_USER_ID,
                    folderId: parentId
                });
                await this.loadData();
                Toast.success(`Created ${type}: ${name}`);
            }
        });
        modal.open();
    }

    private renameItem(id: string, type: 'folder' | 'file', currentName: string, contextType: DocumentType = 'note'): void {
        const modal = new CreationModal({
             type: type,
             mode: 'rename',
             fileType: contextType, // Visual context
             initialValue: currentName,
             onConfirm: async (newName, _) => { // Type doesn't change on rename
                 if (type === 'folder') {
                     await folderService.update(id, { name: newName });
                 } else {
                     await documentService.update(id, { title: newName });
                 }
                 await this.loadData();
                 Toast.success('Renamed successfully');
             }
        });
        modal.open();
    }

    private async deleteItem(id: string, type: 'folder' | 'file', name: string): Promise<void> {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            if (type === 'folder') {
                await folderService.remove(id); // Recursive
            } else {
                await documentService.remove(id);
            }
            await this.loadData();
            Toast.success('Deleted successfully');
        } catch (err) {
            console.error(err);
            Toast.error('Failed to delete');
        }
    }

    // Context Menu Helpers
    private showCategoryContextMenu(e: MouseEvent): void {
        // Determine type from category
        const target = (e.target as HTMLElement).closest('.tree-category');
        const catId = target?.getAttribute('data-category-id');
        let type: DocumentType = 'note';
        if (catId === 'canvas') type = 'canvas';
        if (catId === 'erd') type = 'erd';

        const menuItems: ContextMenuItem[] = [
          { label: 'New File', icon: IconFilePlus, action: () => this.createNewNote(type) },
          { label: 'New Folder', icon: IconFolderPlus, action: () => this.createNewFolder(type) }
        ];
        ContextMenu.show(menuItems, e.clientX, e.clientY);
    }

    private showFolderContextMenu(e: MouseEvent, header: HTMLElement): void {
        const folderId = header.getAttribute('data-id'); // Header is the .tree-item.folder
        if (!folderId) return;

        // Find the folder object to know its type (Strict typing)
        // Since we don't have the folder object handy, we might need to look it up from this.categories
        // For optimization, let's assume we can fetch it or pass it. 
        // For now, I'll default to 'note' if not found, but we should find it.
        // const type: DocumentType = 'note'; // TODO: finding logic

        // Actually, we can look it up in Categories if we iterate
        // Or we attach data-type to the HTML
        
        // Let's implement strict type lookup later in Phase 17 optimization. 
        // For now, default to 'note' or try to guess from category? 
        // The header is inside a category div.
        const catId = header.closest('.tree-category')?.getAttribute('data-category-id');
        let derivedType: DocumentType = 'note';
        if (catId === 'canvas') derivedType = 'canvas';
        if (catId === 'erd') derivedType = 'erd';

        const folderName = header.querySelector('span')?.textContent || 'Folder';
        const menuItems: ContextMenuItem[] = [
            { label: 'New File', icon: IconFilePlus, action: () => this.createNewNote(derivedType, folderId) },
            { label: 'New Folder', icon: IconFolderPlus, action: () => this.createNewFolder(derivedType, folderId) },
            { divider: true, label: '', action: () => {} },
            { label: 'Rename', icon: '', action: () => this.renameItem(folderId, 'folder', folderName, derivedType) }, 
             { divider: true, label: '', action: () => {} },
            { label: 'Delete', icon: '', action: () => this.deleteItem(folderId, 'folder', folderName), danger: true },
        ];
        ContextMenu.show(menuItems, e.clientX, e.clientY);
    }

    private showNoteContextMenu(e: MouseEvent, item: HTMLElement): void {
        const noteId = item.getAttribute('data-id');
        const noteName = item.querySelector('span')?.textContent || 'Note';
        if (!noteId) return;

        const menuItems: ContextMenuItem[] = [
            { label: 'Open', icon: '', action: () => Toast.info(`Opening ${noteName}`) },
            { label: 'Rename', icon: '', action: () => this.renameItem(noteId, 'file', noteName) },
             { divider: true, label: '', action: () => {} },
            { label: 'Delete', icon: '', action: () => this.deleteItem(noteId, 'file', noteName), danger: true },
        ];
        ContextMenu.show(menuItems, e.clientX, e.clientY);
    }
}
