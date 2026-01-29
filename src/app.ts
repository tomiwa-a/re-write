import './styles/app.css';
import { ConvexClient } from "convex/browser";
import './styles/components.css';
import './styles/share-modal.css';
import './styles/creation-modal.css';
import './styles/editor.css';
import { ShareModal } from './components/ShareModal';
import { Toast } from './components/Toast';
import { ConfirmationModal } from './components/ConfirmationModal';

import { SidebarManager } from './managers/SidebarManager';
import { RightPaneManager } from './managers/RightPaneManager';
import { EditorManager } from './managers/EditorManager';
import { AuthManager } from './managers/AuthManager';
import { checkAndSeedData } from './lib/initialization';
import { SyncEngine } from './lib/sync';


class App {
  private sidebarManager: SidebarManager;
  private rightPaneManager: RightPaneManager;
  private editorManager: EditorManager;
  private authManager: AuthManager;
  private convexClient: ConvexClient;
  private syncEngine: SyncEngine;

  constructor() {
    console.log('[App] Constructor started');
    this.convexClient = new ConvexClient(import.meta.env.VITE_CONVEX_URL);
    this.syncEngine = new SyncEngine(this.convexClient);
    this.editorManager = new EditorManager(this.convexClient);
    this.authManager = new AuthManager(this.convexClient);
    
    // Connect Auth to Sync
    this.authManager.subscribe(() => {
        const userId = this.authManager.currentUser?._id || null;
        console.log('[App] Auth state changed, setting user ID:', userId);
        void this.syncEngine.setUserId(userId);
    });

    this.sidebarManager = new SidebarManager(this.authManager, this.syncEngine, (id) => {
        console.log('[App] onFileSelect callback triggered for:', id);
        this.editorManager.openDocument(id);
    });
    this.rightPaneManager = new RightPaneManager(this.authManager, this.syncEngine);

    void this.init();
  }

  private async init(): Promise<void> {
    console.log('[App] init() started');
    const firstDocId = await checkAndSeedData();
    console.log('[App] checkAndSeedData result:', firstDocId);
    await this.authManager.init();
    await this.sidebarManager.init();
    this.editorManager.init();
    this.rightPaneManager.render();
    
    if (firstDocId) {
      console.log('[App] init: Selecting first document:', firstDocId);
      this.sidebarManager.selectFile(firstDocId);
    } else {
        console.warn('[App] init: No first document to select');
    }
    
    // Auto-collapse sidebar on mobile/tablet
    if (window.innerWidth <= 1024) {
        document.querySelector('.sidebar')?.classList.add('collapsed');
    }

    this.setupEventListeners();
    this.setupAvatarDropdown();
    console.log('[App] init() completed');
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

    // Right Pane Toggle
    const rightPaneToggle = document.getElementById('mobile-right-sidebar-toggle');
    const backdrop = document.getElementById('sidebar-backdrop'); // Keep backdrop for right pane

    if (rightPaneToggle) {
        rightPaneToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            document.body.classList.toggle('right-pane-open');
        });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        document.body.classList.remove('right-pane-open');
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
      
      // Handle Auth State
      this.authManager.subscribe(() => {
          this.updateAvatarUI();
      });
      // Initial render
      this.updateAvatarUI();
    }
  }

  private updateAvatarUI(): void {
      const user = this.authManager.currentUser;
      const avatarContainer = document.querySelector('.avatar-container') as HTMLElement;
      const dropdown = document.getElementById('avatar-dropdown');
      
      if (!dropdown) return;

      if (user) {
          // Logged In
          if (avatarContainer) {
             // Show User Avatar (or initials)
             if (user.image) {
                 avatarContainer.innerHTML = `<img src="${user.image}" alt="User" style="width:100%; height:100%; border-radius:50%">`;
             } else {
                 const initial = user.name ? user.name[0].toUpperCase() : 'U';
                 avatarContainer.innerHTML = `<span class="avatar-initial">${initial}</span>`;
                 avatarContainer.style.background = 'var(--accent-color)';
             }
          }

          dropdown.innerHTML = `
            <div class="dropdown-header">
              <div class="user-info">
                <div class="user-name">${user.name || 'User'}</div>
                <div class="user-email">${user.email || ''}</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item">
              ${this.getIcon('settings')}
              Settings
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item danger" id="logout-btn">
              ${this.getIcon('logout')}
              Log Out
            </button>
          `;
          
          document.getElementById('logout-btn')?.addEventListener('click', () => {
              const modal = new ConfirmationModal({
                  title: 'Log Out',
                  message: 'Are you sure you want to log out?',
                  confirmText: 'Log Out',
                  cancelText: 'Cancel',
                  isDanger: true,
                  onConfirm: async () => {
                      await this.authManager.signOut();
                  }
              });
              modal.open();
          });

      } else {
          // Guest
          if (avatarContainer) {
              avatarContainer.innerHTML = `<span class="avatar-initial">?</span>`; // Or Guest Icon
              avatarContainer.style.background = '#666';
          }
           
          dropdown.innerHTML = `
            <div class="dropdown-header">
              <div class="user-info">
                <div class="user-name">Guest Mode</div>
                <div class="user-email">Sign in to sync your notes</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="login-google">
               ${this.getIcon('google')}
               Sign in with Google
            </button>
             <button class="dropdown-item" id="login-github">
               ${this.getIcon('github')}
               Sign in with GitHub
            </button>
          `;

          document.getElementById('login-google')?.addEventListener('click', () => {
              this.authManager.signIn('google');
          });
          document.getElementById('login-github')?.addEventListener('click', () => {
              this.authManager.signIn('github');
          });
      }
  }

  private getIcon(name: string): string {
      // Helper for icons (svg strings)
      if (name === 'logout') return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
      if (name === 'settings') return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
      if (name === 'google') return '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10H12v4h5.5c-.75 3.3-3.05 5.5-5.5 5.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.6 0 3.1.6 4.1 1.6l3-3C17.4 3.7 14.9 2 12 2z"/></svg>'; // Simplified G
      if (name === 'github') return '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.3v3.5c0 .3.2.7.8.6A12 12 0 0 0 12 0z"/></svg>';
      return '';
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
