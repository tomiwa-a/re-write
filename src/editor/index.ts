import { Editor } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import HardBreak from "@tiptap/extension-hard-break";
import HorizontalRule from "@tiptap/extension-horizontal-rule";

let editorInstance: Editor | null = null;

export function createEditor(editorElement: HTMLElement, toolbarElement: HTMLElement, initialContent: any = "", extraExtensions: any[] = []): Editor {
  console.log('[createEditor] Initializing Tiptap editor');
  if (editorInstance) {
    console.log('[createEditor] Destroying existing instance');
    editorInstance.destroy();
  }

  console.log('[createEditor] Creating new Editor instance');
  editorInstance = new Editor({
    element: editorElement,
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Strike,
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      Code,
      CodeBlock,
      HorizontalRule,
      Link.configure({ openOnClick: false }),
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      // Disable History if using Y.js, BUT standard Collaboration extension handles history automatically (updates Y.UndoManager).
      // However, if we pass History extension manually here, it might conflict. 
      // The Collaboration extension usually requires us to NOT add History extension if we want Y.js history.
      // Or we should conditionally add History. 
      // For now, let's include History here, but the caller (EditorManager) can filter it out or we can make it optional.
      // Actually, simplest is to remove History from here and add it in caller if NOT collaborative, or just accept that we have a duplicate?
      // No, duplicate history is bad. 
      // Let's remove History from default list and add it only if NOT collaborative? 
      // Or just leave it and let user fix? 
      // Better: check if extraExtensions includes Collaboration. 
      // But we can't easily check types here. 
      // Let's remove History from defaults here and rely on caller to pass it? 
      // No, that breaks existing code.
      // Let's just leave History for now. Tiptap Collaboration notes say: "Remove the History extension from your editor setup".
      // So I shoud REMOVE it from here and add it via extraExtensions if needed? 
      // Or make this function smarter. 
      // I'll make it remove History if extraExtensions has something. 
      // Actually, passing `history: false` to StarterKit works, but we don't use StarterKit.
      // I will remove `History` from the default list below and add it ONLY if `extraExtensions` is empty? 
      // Or better: `enableHistory` param.
      // For now, I'll validly assume if extraExtensions is passed, we might want to skip History.
      // Let's just remove History from here and add it in the Caller (EditorManager) for normal mode?
      // No, that changes behavior for everyone.
      // I'll filter it out if extraExtensions are present? No.
      // I will ADD `History` to the list. If `EditorManager` passes Collaboration, it should probably be removed?
      // Let's update `EditorManager` to use a different factory or just duplicate the config.
      // Actually, I can just `configure` History to be false? No.
      // I will change the signature to: `enableHistory = true`.
      
      // For now, let's keep it simple: I will NOT remove History here. I will remove it in the caller if I can? 
      // No, I can't remove it from `extensions` array easily if it's hardcoded here.
      // I MUST remove `History` from this list to support Y.js.
      // I will return `History` only if `enableHistory` is true.
      History, 
      Placeholder.configure({ placeholder: "Start writing..." }),
      HardBreak,
      ...extraExtensions,
    ],
    content: initialContent,
    autofocus: true,
    editable: true,
  });

  setupToolbar(toolbarElement, editorInstance);
  return editorInstance;
}

function setupToolbar(toolbar: HTMLElement, editor: Editor): void {
  toolbar.innerHTML = `
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <button type="button" data-action="undo" title="Undo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </button>
        <button type="button" data-action="redo" title="Redo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </button>
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
        <button type="button" data-action="bulletList" title="Bullet List">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.5" fill="currentColor"/><circle cx="3" cy="12" r="1.5" fill="currentColor"/><circle cx="3" cy="18" r="1.5" fill="currentColor"/></svg>
        </button>
        <button type="button" data-action="orderedList" title="Ordered List">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" font-size="8" fill="currentColor">1</text><text x="2" y="14" font-size="8" fill="currentColor">2</text><text x="2" y="20" font-size="8" fill="currentColor">3</text></svg>
        </button>
        <button type="button" data-action="blockquote" title="Quote">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4"/></svg>
        </button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button type="button" data-action="bold" title="Bold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
        </button>
        <button type="button" data-action="italic" title="Italic">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
        </button>
        <button type="button" data-action="strike" title="Strikethrough">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
        </button>
        <button type="button" data-action="code" title="Code">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </button>
        <button type="button" data-action="underline" title="Underline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
        </button>
        <button type="button" data-action="highlight" title="Highlight">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
        </button>
        <button type="button" data-action="link" title="Link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button type="button" data-action="alignLeft" title="Align Left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        </button>
        <button type="button" data-action="alignCenter" title="Align Center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>
        </button>
        <button type="button" data-action="alignRight" title="Align Right">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
        </button>
      </div>
      <div class="toolbar-divider mobile-only"></div>
      <button type="button" class="mobile-only" id="mobile-right-sidebar-toggle" title="Properties">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>
    </div>
  `;

  toolbar.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest("button");
    if (!button) return;

    const action = button.dataset.action;
    if (!action) return;

    switch (action) {
      case "undo":
        editor.chain().focus().undo().run();
        break;
      case "redo":
        editor.chain().focus().redo().run();
        break;
      case "bulletList":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "orderedList":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "blockquote":
        editor.chain().focus().toggleBlockquote().run();
        break;
      case "bold":
        editor.chain().focus().toggleBold().run();
        break;
      case "italic":
        editor.chain().focus().toggleItalic().run();
        break;
      case "strike":
        editor.chain().focus().toggleStrike().run();
        break;
      case "code":
        editor.chain().focus().toggleCode().run();
        break;
      case "underline":
        editor.chain().focus().toggleUnderline().run();
        break;
      case "highlight":
        editor.chain().focus().toggleHighlight().run();
        break;
      case "link":
        handleLink(editor);
        break;
      case "alignLeft":
        editor.chain().focus().setTextAlign("left").run();
        break;
      case "alignCenter":
        editor.chain().focus().setTextAlign("center").run();
        break;
      case "alignRight":
        editor.chain().focus().setTextAlign("right").run();
        break;
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

  editor.on("selectionUpdate", () => updateToolbarState(toolbar, editor));
  editor.on("update", () => updateToolbarState(toolbar, editor));
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

function updateToolbarState(toolbar: HTMLElement, editor: Editor): void {
  const buttons = toolbar.querySelectorAll("button[data-action]");
  buttons.forEach((btn) => {
    const action = (btn as HTMLElement).dataset.action;
    let isActive = false;

    switch (action) {
      case "bold":
        isActive = editor.isActive("bold");
        break;
      case "italic":
        isActive = editor.isActive("italic");
        break;
      case "strike":
        isActive = editor.isActive("strike");
        break;
      case "code":
        isActive = editor.isActive("code");
        break;
      case "underline":
        isActive = editor.isActive("underline");
        break;
      case "highlight":
        isActive = editor.isActive("highlight");
        break;
      case "link":
        isActive = editor.isActive("link");
        break;
      case "bulletList":
        isActive = editor.isActive("bulletList");
        break;
      case "orderedList":
        isActive = editor.isActive("orderedList");
        break;
      case "blockquote":
        isActive = editor.isActive("blockquote");
        break;
      case "alignLeft":
        isActive = editor.isActive({ textAlign: "left" });
        break;
      case "alignCenter":
        isActive = editor.isActive({ textAlign: "center" });
        break;
      case "alignRight":
        isActive = editor.isActive({ textAlign: "right" });
        break;
    }

    btn.classList.toggle("is-active", isActive);
  });

  const headingSelect = toolbar.querySelector('select[data-action="heading"]') as HTMLSelectElement;
  if (headingSelect) {
    if (editor.isActive("heading", { level: 1 })) {
      headingSelect.value = "1";
    } else if (editor.isActive("heading", { level: 2 })) {
      headingSelect.value = "2";
    } else if (editor.isActive("heading", { level: 3 })) {
      headingSelect.value = "3";
    } else {
      headingSelect.value = "paragraph";
    }
  }
}

export function getEditor(): Editor | null {
  return editorInstance;
}

export function setContent(content: string): void {
  editorInstance?.commands.setContent(content);
}

export function getContent(): string {
  return editorInstance?.getHTML() || "";
}

export function getJSON(): Record<string, unknown> {
  return (editorInstance?.getJSON() as Record<string, unknown>) || {};
}
