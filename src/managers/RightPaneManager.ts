import { ClockIcon } from '../assets/icons/clock';
import { CloudCheckIcon } from '../assets/icons/cloud';
import { GlobeIcon } from '../assets/icons/globe';
import { ShareModal } from '../components/ShareModal';
import { AuthManager } from './AuthManager';
import { SyncEngine, SyncStatus } from '../lib/sync';
import { connectionManager } from './ConnectionManager';

export class RightPaneManager {
    private authManager: AuthManager;
    private syncEngine: SyncEngine;
    private currentSyncStatus: SyncStatus = 'offline';
    private lastSyncTime: number | null = null;

    constructor(authManager: AuthManager, syncEngine: SyncEngine) {
        this.authManager = authManager;
        this.syncEngine = syncEngine;
        
        this.authManager.subscribe(() => {
            this.renderSyncStatus();
        });

        // Use SyncEngine status instead of basic connection manager
        this.syncEngine.subscribeToStatus((status, lastSync) => {
            this.currentSyncStatus = status;
            this.lastSyncTime = lastSync;
            this.renderSyncStatus();
        });
    }

    public render(): void {
        this.renderSyncStatus();
        this.renderShareCard();
        this.renderHistory();
    }

    private renderSyncStatus(): void {
        const syncCard = document.getElementById('sync-status-card');
        const user = this.authManager.currentUser;
        const isOnline = connectionManager.isOnline;
        
        if (syncCard) {
            let syncText: string;
            let connText: string;
            let syncIconClass: string;
            let connIconClass: string;

            // Connection Status (Bottom Row)
            if (!isOnline) {
                connText = 'Offline';
                connIconClass = 'warning';
            } else {
                 connText = 'Online';
                 connIconClass = 'success';
            }

            // Sync Status (Top Row)
            if (!user) {
                syncText = 'Local Only';
                syncIconClass = 'neutral';
            } else {
               switch (this.currentSyncStatus) {
                   case 'syncing':
                       syncText = 'Syncing...';
                       syncIconClass = 'neutral';
                       break;
                   case 'synced':
                       syncText = this.lastSyncTime ? `Synced ${this.timeAgo(this.lastSyncTime)}` : 'Synced';
                       syncIconClass = 'success';
                       break;
                   case 'offline':
                       // If we are online but sync status is offline, it typically means we haven't received the first update yet
                       // Or we are reconnecting. The SyncEngine should eventually transition to 'synced' or 'syncing'.
                       // If it stays here too long, it might mean the heartbeat hasn't fired or initial sync is pending.
                       if (isOnline) {
                           syncText = 'Waiting...';
                           syncIconClass = 'neutral';
                       } else {
                           syncText = 'Pending (Offline)';
                           syncIconClass = 'warning';
                       }
                       break;
                   case 'error':
                       syncText = 'Sync Error';
                       syncIconClass = 'error';
                       break;
               }
            }
            
            syncCard.innerHTML = `
                <div class="status-item">
                    <div class="status-icon ${syncIconClass}">${CloudCheckIcon}</div>
                    <div class="status-info">
                        <span class="status-label">Sync Status</span>
                        <span class="status-value">${syncText}</span>
                    </div>
                </div>
                <div class="status-item">
                    <div class="status-icon ${connIconClass}">${GlobeIcon}</div>
                    <div class="status-info">
                        <span class="status-label">Connection</span>
                        <span class="status-value">${connText}</span>
                    </div>
                </div>
            `;
        }
    }

    private timeAgo(timestamp: number): string {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return 'recently';
    }

    private renderShareCard(): void {
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
    }

    private renderHistory(): void {
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
}
