import './styles/app.css';
import './styles/components.css';
import './styles/share-modal.css';
import './styles/creation-modal.css';
import './styles/editor.css';
import { ShareModal } from './components/ShareModal';
import { Toast } from './components/Toast';

import { SidebarManager } from './managers/SidebarManager';
import { RightPaneManager } from './managers/RightPaneManager';
import { EditorManager } from './managers/EditorManager';
import { checkAndSeedData } from './lib/initialization';


class App {
  private sidebarManager: SidebarManager;
  private rightPaneManager: RightPaneManager;
  private editorManager: EditorManager;

  constructor() {
    this.editorManager = new EditorManager();
    this.sidebarManager = new SidebarManager((id) => this.editorManager.openDocument(id));
    this.rightPaneManager = new RightPaneManager();

    void this.init();
  }

  private async init(): Promise<void> {
    await checkAndSeedData();
    await this.sidebarManager.init();
    this.editorManager.init();
    this.rightPaneManager.render();
    
    this.setupEventListeners();
    this.setupAvatarDropdown();
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
         Toast.success('Creating new note...');
      });
    }

    // Sidebar Toggle
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');

    if (sidebar && sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
          sidebar.classList.toggle('collapsed');
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
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
