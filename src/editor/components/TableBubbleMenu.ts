
import { Editor } from "@tiptap/core";
import { Icons } from "../../assets/icons";

function createTableBubbleMenuElement(): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'bubble-menu table-bubble-menu';
  menu.style.display = 'flex';
  menu.style.gap = '4px';
  menu.style.padding = '8px';
  menu.style.background = 'white';
  menu.style.borderRadius = '8px';
  menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
  menu.style.border = '1px solid var(--border)';
  menu.style.flexWrap = 'wrap';
  menu.style.maxWidth = '400px';
  
  const icon = (svg: string) => `<span style="display: flex;">${svg}</span>`;

  const groups = [
    {
      name: 'Columns',
      items: [
        { action: 'addColumnBefore', title: 'Add Col Before', icon: icon(Icons.addColBefore) },
        { action: 'addColumnAfter', title: 'Add Col After', icon: icon(Icons.addColAfter) },
        { action: 'deleteColumn', title: 'Delete Col', icon: icon(Icons.deleteCol) },
      ]
    },
    {
      name: 'Rows',
      items: [
        { action: 'addRowBefore', title: 'Add Row Before', icon: icon(Icons.addRowBefore) },
        { action: 'addRowAfter', title: 'Add Row After', icon: icon(Icons.addRowAfter) },
        { action: 'deleteRow', title: 'Delete Row', icon: icon(Icons.deleteRow) },
      ]
    },
    {
      name: 'Merge',
      items: [
        { action: 'mergeCells', title: 'Merge', icon: icon(Icons.mergeCells) },
        { action: 'splitCell', title: 'Split', icon: icon(Icons.splitCell) },
      ]
    },
    {
      name: 'Utils',
      items: [
        { action: 'toggleHeaderColumn', title: 'Header Col', icon: icon(Icons.toggleHeaderCol) },
        { action: 'toggleHeaderRow', title: 'Header Row', icon: icon(Icons.toggleHeaderRow) },
        { action: 'toggleHeaderCell', title: 'Header Cell', icon: icon(Icons.toggleHeaderCell) },
        { action: 'deleteTable', title: 'Delete Table', icon: icon(Icons.deleteTable) },
      ]
    }
  ];

  groups.forEach((group, index) => {
    if (index > 0) {
      const divider = document.createElement('div');
      divider.style.width = '1px';
      divider.style.background = 'var(--border)';
      divider.style.margin = '0 4px';
      menu.appendChild(divider);
    }
    
    group.items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bubble-menu-btn';
      btn.dataset.action = item.action;
      btn.title = item.title;
      btn.innerHTML = item.icon;
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.padding = '4px';
      btn.style.borderRadius = '4px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.color = 'var(--text-secondary)';
      
      btn.onmouseenter = () => btn.style.background = 'rgba(0,0,0,0.05)';
      btn.onmouseleave = () => btn.style.background = 'transparent';
      
      menu.appendChild(btn);
    });
  });

  return menu;
}

export function setupTableBubbleMenu(menu: HTMLElement, editor: Editor) {
  menu.addEventListener('click', (e) => {
    if (editor.isDestroyed) return;
    const btn = (e.target as HTMLElement).closest('button');
    if (!btn) return;
    
    const action = btn.dataset.action;
    
    switch (action) {
      case 'addColumnBefore': editor.chain().focus().addColumnBefore().run(); break;
      case 'addColumnAfter': editor.chain().focus().addColumnAfter().run(); break;
      case 'deleteColumn': editor.chain().focus().deleteColumn().run(); break;
      case 'addRowBefore': editor.chain().focus().addRowBefore().run(); break;
      case 'addRowAfter': editor.chain().focus().addRowAfter().run(); break;
      case 'deleteRow': editor.chain().focus().deleteRow().run(); break;
      case 'mergeCells': editor.chain().focus().mergeCells().run(); break;
      case 'splitCell': editor.chain().focus().splitCell().run(); break;
      case 'toggleHeaderColumn': editor.chain().focus().toggleHeaderColumn().run(); break;
      case 'toggleHeaderRow': editor.chain().focus().toggleHeaderRow().run(); break;
      case 'toggleHeaderCell': editor.chain().focus().toggleHeaderCell().run(); break;
      case 'deleteTable': editor.chain().focus().deleteTable().run(); break;
    }
  });
}

export { createTableBubbleMenuElement };
