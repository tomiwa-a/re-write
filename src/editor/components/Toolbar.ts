
import { Editor } from "@tiptap/core";
import { Icons } from "../../assets/icons";

// Helper for icons
const icon = (svg: string) => `<span style="display: flex;">${svg}</span>`;

export function createToolbar(editor: Editor, onImageUpload: () => void): HTMLElement {
  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";
  
  toolbar.innerHTML = `
    <div class="toolbar-group">
      <button type="button" data-action="undo" title="Undo">${icon(Icons.undo)}</button>
      <button type="button" data-action="redo" title="Redo">${icon(Icons.redo)}</button>
    </div>
    <div class="toolbar-divider"></div>
    <div class="toolbar-group">
      <select data-action="heading" title="Heading">
        <option value="paragraph">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>
    </div>
    <div class="toolbar-divider"></div>
    <div class="toolbar-group">
      <button type="button" data-action="bulletList" title="Bullet List">${icon(Icons.bulletList)}</button>
      <button type="button" data-action="orderedList" title="Ordered List">${icon(Icons.orderedList)}</button>
      <button type="button" data-action="blockquote" title="Quote">${icon(Icons.blockquote)}</button>
      <button type="button" data-action="taskList" title="Task List">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      </button>
      <button type="button" data-action="table" title="Insert Table">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
      </button>
      <button type="button" data-action="image" title="Insert Image">${icon(Icons.image)}</button>
    </div>
    <div class="toolbar-divider"></div>
    <div class="toolbar-group">
      <button type="button" data-action="bold" title="Bold">${icon(Icons.bold)}</button>
      <button type="button" data-action="italic" title="Italic">${icon(Icons.italic)}</button>
      <button type="button" data-action="strike" title="Strikethrough">${icon(Icons.strike)}</button>
      <button type="button" data-action="code" title="Code">${icon(Icons.code)}</button>
      <button type="button" data-action="underline" title="Underline">${icon(Icons.underline)}</button>
      <button type="button" data-action="highlight" title="Highlight">${icon(Icons.highlight)}</button>
      <button type="button" data-action="link" title="Link">${icon(Icons.link)}</button>
    </div>
    <div class="toolbar-divider"></div>
    <div class="toolbar-group">
      <button type="button" data-action="alignLeft" title="Align Left">${icon(Icons.alignLeft)}</button>
      <button type="button" data-action="alignCenter" title="Align Center">${icon(Icons.alignCenter)}</button>
      <button type="button" data-action="alignRight" title="Align Right">${icon(Icons.alignRight)}</button>
    </div>
    <div class="toolbar-divider mobile-only"></div>
    <button type="button" class="mobile-only" id="mobile-right-sidebar-toggle" title="Properties">${icon(Icons.mobileToggle)}</button>
  `;

  setupToolbarEvents(toolbar, editor, onImageUpload);
  return toolbar;
}

function setupToolbarEvents(toolbar: HTMLElement, editor: Editor, onImageUpload: () => void) {
  toolbar.addEventListener("click", (e) => {
    if (editor.isDestroyed) return;
    
    const target = e.target as HTMLElement;
    const button = target.closest("button");
    if (!button) return;

    const action = button.dataset.action;
    if (!action) return;

    switch (action) {
      case "undo": editor.chain().focus().undo().run(); break;
      case "redo": editor.chain().focus().redo().run(); break;
      case "bulletList": editor.chain().focus().toggleBulletList().run(); break;
      case "orderedList": editor.chain().focus().toggleOrderedList().run(); break;
      case "blockquote": editor.chain().focus().toggleBlockquote().run(); break;
      case "bold": editor.chain().focus().toggleBold().run(); break;
      case "italic": editor.chain().focus().toggleItalic().run(); break;
      case "strike": editor.chain().focus().toggleStrike().run(); break;
      case "code": editor.chain().focus().toggleCode().run(); break;
      case "underline": editor.chain().focus().toggleUnderline().run(); break;
      case "highlight": editor.chain().focus().toggleHighlight().run(); break;
      case "link": handleLink(editor); break;
      case "alignLeft": editor.chain().focus().setTextAlign("left").run(); break;
      case "alignCenter": editor.chain().focus().setTextAlign("center").run(); break;
      case "alignRight": editor.chain().focus().setTextAlign("right").run(); break;
      case "taskList": editor.chain().focus().toggleTaskList().run(); break;
      case "table": editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); break;
      case "image": onImageUpload(); break;
    }

    updateToolbarState(toolbar, editor);
  });

  const headingSelect = toolbar.querySelector('select[data-action="heading"]') as HTMLSelectElement;
  if (headingSelect) {
    headingSelect.addEventListener("change", () => {
      const value = headingSelect.value;
      if (value === "paragraph") {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().toggleHeading({ level: parseInt(value) as 1 | 2 | 3 }).run();
      }
    });
  }

  // Initial update
  updateToolbarState(toolbar, editor);
}

export function updateToolbarState(toolbar: HTMLElement, editor: Editor) {
  if (editor.isDestroyed) return;

  // Active states
  const buttons = toolbar.querySelectorAll("button[data-action]");
  buttons.forEach(btn => {
    const action = (btn as HTMLElement).dataset.action;
    let isActive = false;
    
    switch (action) {
      case 'bold': isActive = editor.isActive('bold'); break;
      case 'italic': isActive = editor.isActive('italic'); break;
      case 'strike': isActive = editor.isActive('strike'); break;
      case 'code': isActive = editor.isActive('code'); break;
      case 'underline': isActive = editor.isActive('underline'); break;
      case 'highlight': isActive = editor.isActive('highlight'); break;
      case 'link': isActive = editor.isActive('link'); break;
      case 'bulletList': isActive = editor.isActive('bulletList'); break;
      case 'orderedList': isActive = editor.isActive('orderedList'); break;
      case 'blockquote': isActive = editor.isActive('blockquote'); break;
      case 'taskList': isActive = editor.isActive('taskList'); break;
      case 'alignLeft': isActive = editor.isActive({ textAlign: 'left' }); break;
      case 'alignCenter': isActive = editor.isActive({ textAlign: 'center' }); break;
      case 'alignRight': isActive = editor.isActive({ textAlign: 'right' }); break;
    }
    
    if (isActive) btn.classList.add('is-active');
    else btn.classList.remove('is-active');
  });

  // Heading select
  const headingSelect = toolbar.querySelector('select[data-action="heading"]') as HTMLSelectElement;
  if (headingSelect) {
    if (editor.isActive('heading', { level: 1 })) headingSelect.value = '1';
    else if (editor.isActive('heading', { level: 2 })) headingSelect.value = '2';
    else if (editor.isActive('heading', { level: 3 })) headingSelect.value = '3';
    else headingSelect.value = 'paragraph';
  }
}

function handleLink(editor: Editor): void {
  const previousUrl = editor.getAttributes("link").href;
  const url = window.prompt("URL", previousUrl);

  if (url === null) return;

  if (url === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}
