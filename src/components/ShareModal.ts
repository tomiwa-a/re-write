/**
 * Share Modal Component
 * Multi-tab modal for sharing notes with link generation, invitations, and export options
 */

import { Modal } from './Modal';
import { Toast } from './Toast';

export class ShareModal {
  private modal: Modal;
  private currentTab: 'link' | 'invite' | 'export' = 'link';

  constructor() {
    this.modal = new Modal({
      title: 'Share',
      width: '550px',
      content: this.createContent(),
    });
  }

  private createContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'share-modal';

    // Tabs
    const tabs = this.createTabs();
    container.appendChild(tabs);

    // Tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'share-modal-content';
    tabContent.id = 'share-tab-content';
    this.updateTabContent(tabContent);

    container.appendChild(tabContent);

    return container;
  }

  private createTabs(): HTMLElement {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'share-modal-tabs';

    const tabs = [
      { id: 'link', label: 'Share Link', icon: this.getLinkIcon() },
      { id: 'invite', label: 'Invite People', icon: this.getUserIcon() },
      { id: 'export', label: 'Export', icon: this.getDownloadIcon() },
    ];

    tabs.forEach((tab) => {
      const button = document.createElement('button');
      button.className = 'share-modal-tab';
      button.dataset.tab = tab.id;

      if (tab.id === this.currentTab) {
        button.classList.add('active');
      }

      const icon = document.createElement('span');
      icon.innerHTML = tab.icon;

      const label = document.createElement('span');
      label.textContent = tab.label;

      button.appendChild(icon);
      button.appendChild(label);

      button.onclick = () => this.switchTab(tab.id as typeof this.currentTab);

      tabsContainer.appendChild(button);
    });

    return tabsContainer;
  }

  private switchTab(tab: typeof this.currentTab): void {
    this.currentTab = tab;

    // Update tab buttons
    const tabButtons = document.querySelectorAll('.share-modal-tab');
    tabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    // Update content
    const content = document.getElementById('share-tab-content');
    if (content) {
      this.updateTabContent(content);
    }
  }

  private updateTabContent(container: HTMLElement): void {
    container.innerHTML = '';

    switch (this.currentTab) {
      case 'link':
        container.appendChild(this.createLinkTab());
        break;
      case 'invite':
        container.appendChild(this.createInviteTab());
        break;
      case 'export':
        container.appendChild(this.createExportTab());
        break;
    }
  }

  private createLinkTab(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'share-tab-panel';

    // Link input
    const linkGroup = document.createElement('div');
    linkGroup.className = 'share-link-group';

    const linkInput = document.createElement('input');
    linkInput.type = 'text';
    linkInput.className = 'share-link-input';
    linkInput.value = 'https://app.design/share/a1b2c3d4';
    linkInput.readOnly = true;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-primary';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = () => this.copyLink(linkInput.value);

    linkGroup.appendChild(linkInput);
    linkGroup.appendChild(copyBtn);
    content.appendChild(linkGroup);

    // QR Code
    const qrSection = document.createElement('div');
    qrSection.className = 'share-qr-section';

    const qrLabel = document.createElement('label');
    qrLabel.textContent = 'QR Code';
    qrLabel.className = 'share-label';

    const qrCode = document.createElement('div');
    qrCode.className = 'share-qr-code';
    qrCode.innerHTML = this.generateQRPlaceholder();

    qrSection.appendChild(qrLabel);
    qrSection.appendChild(qrCode);
    content.appendChild(qrSection);

    // Permissions
    const permSection = document.createElement('div');
    permSection.className = 'share-section';

    const permLabel = document.createElement('label');
    permLabel.textContent = 'Permissions';
    permLabel.className = 'share-label';

    const permSelect = document.createElement('select');
    permSelect.className = 'share-select';

    const options = [
      { value: 'view', label: 'View only' },
      { value: 'comment', label: 'Can comment' },
      { value: 'edit', label: 'Can edit' },
    ];

    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      permSelect.appendChild(option);
    });

    permSection.appendChild(permLabel);
    permSection.appendChild(permSelect);
    content.appendChild(permSection);

    // Expiration
    const expSection = document.createElement('div');
    expSection.className = 'share-section';

    const expLabel = document.createElement('label');
    expLabel.textContent = 'Link Expiration';
    expLabel.className = 'share-label';

    const expSelect = document.createElement('select');
    expSelect.className = 'share-select';

    const expOptions = [
      { value: '24h', label: '24 hours' },
      { value: '7d', label: '7 days' },
      { value: '30d', label: '30 days' },
      { value: 'never', label: 'Never' },
    ];

    expOptions.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === 'never') option.selected = true;
      expSelect.appendChild(option);
    });

    expSection.appendChild(expLabel);
    expSection.appendChild(expSelect);
    content.appendChild(expSection);

    return content;
  }

  private createInviteTab(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'share-tab-panel';

    // Email input
    const inviteGroup = document.createElement('div');
    inviteGroup.className = 'share-invite-group';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.className = 'share-input';
    emailInput.placeholder = 'Enter email address';

    const roleSelect = document.createElement('select');
    roleSelect.className = 'share-select-inline';

    const roles = [
      { value: 'view', label: 'Viewer' },
      { value: 'edit', label: 'Editor' },
    ];

    roles.forEach((role) => {
      const option = document.createElement('option');
      option.value = role.value;
      option.textContent = role.label;
      roleSelect.appendChild(option);
    });

    const inviteBtn = document.createElement('button');
    inviteBtn.className = 'btn btn-primary';
    inviteBtn.textContent = 'Invite';
    inviteBtn.onclick = () => this.sendInvite(emailInput.value, roleSelect.value);

    inviteGroup.appendChild(emailInput);
    inviteGroup.appendChild(roleSelect);
    inviteGroup.appendChild(inviteBtn);
    content.appendChild(inviteGroup);

    // Collaborators list
    const collabSection = document.createElement('div');
    collabSection.className = 'share-section';

    const collabLabel = document.createElement('label');
    collabLabel.textContent = 'Current Collaborators';
    collabLabel.className = 'share-label';

    const collabList = document.createElement('div');
    collabList.className = 'share-collaborators';

    // Mock collaborators
    const collaborators = [
      { name: 'You', email: 'you@example.com', role: 'Owner' },
      { name: 'John Doe', email: 'john@example.com', role: 'Editor' },
    ];

    collaborators.forEach((collab) => {
      const item = document.createElement('div');
      item.className = 'share-collaborator';

      const avatar = document.createElement('div');
      avatar.className = 'share-avatar';
      avatar.textContent = collab.name[0];

      const info = document.createElement('div');
      info.className = 'share-collab-info';

      const name = document.createElement('div');
      name.className = 'share-collab-name';
      name.textContent = collab.name;

      const email = document.createElement('div');
      email.className = 'share-collab-email';
      email.textContent = collab.email;

      info.appendChild(name);
      info.appendChild(email);

      const badge = document.createElement('span');
      badge.className = 'share-role-badge';
      badge.textContent = collab.role;

      item.appendChild(avatar);
      item.appendChild(info);
      item.appendChild(badge);

      collabList.appendChild(item);
    });

    collabSection.appendChild(collabLabel);
    collabSection.appendChild(collabList);
    content.appendChild(collabSection);

    return content;
  }

  private createExportTab(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'share-tab-panel';

    const exportOptions = [
      { format: 'PDF', icon: this.getFileIcon(), description: 'Export as PDF document' },
      { format: 'Markdown', icon: this.getFileIcon(), description: 'Export as Markdown file' },
      { format: 'HTML', icon: this.getFileIcon(), description: 'Export as HTML file' },
      { format: 'JSON', icon: this.getFileIcon(), description: 'Export raw data as JSON' },
    ];

    exportOptions.forEach((option) => {
      const item = document.createElement('div');
      item.className = 'share-export-item';

      const iconEl = document.createElement('span');
      iconEl.className = 'share-export-icon';
      iconEl.innerHTML = option.icon;

      const info = document.createElement('div');
      info.className = 'share-export-info';

      const format = document.createElement('div');
      format.className = 'share-export-format';
      format.textContent = option.format;

      const desc = document.createElement('div');
      desc.className = 'share-export-desc';
      desc.textContent = option.description;

      info.appendChild(format);
      info.appendChild(desc);

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'btn btn-secondary';
      downloadBtn.textContent = 'Download';
      downloadBtn.onclick = () => this.exportFile(option.format);

      item.appendChild(iconEl);
      item.appendChild(info);
      item.appendChild(downloadBtn);

      content.appendChild(item);
    });

    return content;
  }

  private copyLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      Toast.success('Link copied to clipboard!');
    });
  }

  private sendInvite(email: string, role: string): void {
    if (!email) {
      Toast.error('Please enter an email address');
      return;
    }

    // Mock invite
    Toast.success(`Invitation sent to ${email} as ${role}`);
  }

  private exportFile(format: string): void {
    // Mock export
    Toast.success(`Exporting as ${format}...`);
  }

  private generateQRPlaceholder(): string {
    return `
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#f9fafb" rx="8"/>
        <rect x="10" y="10" width="30" height="30" fill="#111827" rx="2"/>
        <rect x="80" y="10" width="30" height="30" fill="#111827" rx="2"/>
        <rect x="10" y="80" width="30" height="30" fill="#111827" rx="2"/>
        <rect x="50" y="50" width="20" height="20" fill="#111827" rx="2"/>
      </svg>
    `;
  }

  // Icons
  private getLinkIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
  }

  private getUserIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  }

  private getDownloadIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
  }

  private getFileIcon(): string {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
  }

  public open(): void {
    this.modal.open();
  }
}
