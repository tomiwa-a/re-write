import { ShareModal } from '../components/ShareModal';
import { CloudCheckIcon } from '../assets/icons/cloud';
import { GlobeIcon } from '../assets/icons/globe';
import { ClockIcon } from '../assets/icons/clock';

export class RightPaneManager {
    constructor() {
        // this.render();
    }

    public render(): void {
        this.renderSyncStatus();
        this.renderShareCard();
        this.renderHistory();
    }

    private renderSyncStatus(): void {
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
