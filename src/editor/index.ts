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
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Dropcursor from "@tiptap/extension-dropcursor";

import Placeholder from "@tiptap/extension-placeholder";
import HardBreak from "@tiptap/extension-hard-break";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { OptimisticImage } from "./extensions/OptimisticImage";
import { ImageUploadQueue } from "../lib/ImageUploadQueue";
import { v4 as uuidv4 } from 'uuid';

let editorInstance: Editor | null = null;
let rightPaneToggleListenerAdded = false;
let currentConvex: ConvexClient | null = null;
let currentDocId: string | null = null;
let uploadQueue: ImageUploadQueue | null = null;

function setupRightPaneToggle() {
  if (rightPaneToggleListenerAdded) return;
  
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest("#mobile-right-sidebar-toggle");
    
    if (button) {
      e.stopPropagation();
      document.body.classList.toggle('right-pane-open');
    }
  });
  
  rightPaneToggleListenerAdded = true;
}

function initUploadQueue() {
  if (!uploadQueue && currentConvex) {
    console.log('[initUploadQueue] Initializing upload queue');
    uploadQueue = new ImageUploadQueue(currentConvex, (tempId, url) => {
      if (!editorInstance) return;
      
      console.log(`[initUploadQueue] Replacing temp image ${tempId} with URL: ${url}`);
      const { state } = editorInstance;
      const { doc } = state;
      
      doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.tempId === tempId) {
          console.log(`[initUploadQueue] Found temp image at pos ${pos}, updating...`);
          if (!editorInstance) return false;
          
          editorInstance.chain()
            .setNodeSelection(pos)
            .updateAttributes('image', {
              src: url,
              uploadStatus: null,
              tempId: null,
            })
            .run();
          
          console.log(`[initUploadQueue] Replaced temp image ${tempId} with URL`);
          return false;
        }
      });
    });
  }
}

export function createEditor(
  editorElement: HTMLElement,
  toolbarElement: HTMLElement,
  initialContent: any = "",
  extraExtensions: any[] = [],
  convex?: ConvexClient,
  documentId?: string
): Editor {
  console.log('[createEditor] Initializing Tiptap editor');
  
  if (convex) currentConvex = convex;
  if (documentId) currentDocId = documentId;
  
  if (editorInstance) {
    console.log('[createEditor] Destroying existing instance');
    editorInstance.destroy();
  }

  setupRightPaneToggle();

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
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      OptimisticImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'tiptap-task-item',
        },
      }),
      Dropcursor.configure({
        color: '#3b82f6',
        width: 2,
      }),
 
      Placeholder.configure({ placeholder: "Start writing..." }),
      HardBreak,
      ...extraExtensions,
    ],
    content: initialContent,
    autofocus: true,
    editable: true,
  });

  editorInstance.on('update', ({ transaction }) => {
    transaction.steps.forEach((step: any) => {
      if (step.slice?.content) {
        step.slice.content.forEach((node: any) => {
          if (node.type.name === 'image' && node.attrs.tempId) {
            console.log(`[Editor] Image deleted with tempId: ${node.attrs.tempId}`);
            uploadQueue?.remove(node.attrs.tempId);
          }
        });
      }
    });
  });

  editorElement.addEventListener('drop', async (event) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imageFile = Array.from(files).find(file => file.type.startsWith('image/'));
    if (!imageFile || !editorInstance) return;

    const tempId = uuidv4();
    console.log(`[Drag-Drop] Image dropped: ${imageFile.name}, temp ID: ${tempId}`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (!base64) return;

      console.log(`[Drag-Drop] Inserting image immediately with base64 (${base64.length} bytes)`);
      editorInstance?.chain().insertContent({
        type: 'image',
        attrs: {
          src: base64,
          uploadStatus: 'pending',
          tempId,
        }
      }).run();

      if (currentConvex && currentDocId) {
        console.log(`[Drag-Drop] Adding to upload queue: ${tempId}`);
        initUploadQueue();
        uploadQueue?.add(tempId, imageFile, base64, currentDocId);
      } else {
        console.warn('[Drag-Drop] No Convex client or document ID - image will stay as base64');
      }
    };
    reader.readAsDataURL(imageFile);
  });

  editorElement.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  let resizeWrapper: HTMLDivElement | null = null;
  let currentImage: HTMLImageElement | null = null;
  let resizeHandle: string | null = null;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  function createResizeHandles(img: HTMLImageElement): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-resize-wrapper', 'true');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.maxWidth = '100%';

    const handles = [
      'top-left', 'top', 'top-right',
      'left', 'right',
      'bottom-left', 'bottom', 'bottom-right'
    ];

    handles.forEach(handle => {
      const handleEl = document.createElement('div');
      handleEl.setAttribute('data-resize-handle', handle);
      wrapper.appendChild(handleEl);
    });

    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.setAttribute('data-resize-state', 'true');

    return wrapper;
  }

  function removeResizeHandles() {
    if (resizeWrapper) {
      const img = resizeWrapper.querySelector('img');
      if (img) {
        resizeWrapper.parentNode?.insertBefore(img, resizeWrapper);
      }
      resizeWrapper.remove();
      resizeWrapper = null;
    }
  }

  editorInstance.on('selectionUpdate', ({ editor }) => {
    removeResizeHandles();
    
    const { selection } = editor.state;
    const { $from } = selection;
    const node = $from.node();
    
    if (node.type.name === 'image') {
      setTimeout(() => {
        const imgElement = editorElement.querySelector('img[src="' + node.attrs.src + '"]') as HTMLImageElement;
        if (imgElement && !resizeWrapper) {
          resizeWrapper = createResizeHandles(imgElement);
          currentImage = imgElement;
        }
      }, 10);
    }
  });

  editorElement.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    const handle = target.getAttribute('data-resize-handle');
    
    if (handle && resizeWrapper && currentImage) {
      e.preventDefault();
      e.stopPropagation();
      resizeHandle = handle;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = currentImage.offsetWidth;
      startHeight = currentImage.offsetHeight;
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (resizeHandle && currentImage && resizeWrapper) {
      e.preventDefault();
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (resizeHandle.includes('right')) {
        newWidth = Math.max(100, startWidth + deltaX);
      } else if (resizeHandle.includes('left')) {
        newWidth = Math.max(100, startWidth - deltaX);
      }

      if (resizeHandle.includes('bottom')) {
        newHeight = Math.max(100, startHeight + deltaY);
      } else if (resizeHandle.includes('top')) {
        newHeight = Math.max(100, startHeight - deltaY);
      }

      const aspectRatio = startWidth / startHeight;
      if (resizeHandle.includes('left') || resizeHandle.includes('right')) {
        newHeight = newWidth / aspectRatio;
      } else if (resizeHandle.includes('top') || resizeHandle.includes('bottom')) {
        newWidth = newHeight * aspectRatio;
      }

      currentImage.style.width = `${newWidth}px`;
      currentImage.style.height = `${newHeight}px`;
      resizeWrapper.style.width = `${newWidth}px`;
      resizeWrapper.style.height = `${newHeight}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (resizeHandle && currentImage && editorInstance) {
      const finalWidth = currentImage.style.width;
      const pos = editorInstance.view.posAtDOM(currentImage, 0);
      
      editorInstance.chain()
        .setNodeSelection(pos)
        .updateAttributes('image', { width: finalWidth })
        .run();
    }
    resizeHandle = null;
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
        <button type="button" data-action="taskList" title="Task List">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </button>
        <button type="button" data-action="table" title="Insert Table">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
        </button>
        <button type="button" data-action="image" title="Insert Image">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
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
      case "taskList":
        editor.chain().focus().toggleTaskList().run();
        break;
      case "table":
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case "image":
        handleImageUpload();
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

function handleImageUpload(): void {
  console.log('[handleImageUpload] Starting image upload');
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = async (e) => {
    console.log('[handleImageUpload] File selected');
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !editorInstance) return;

    const tempId = uuidv4();
    console.log(`[handleImageUpload] Generated temp ID: ${tempId}`);
    
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const base64 = readerEvent.target?.result as string;
      if (!base64) return;

      console.log(`[handleImageUpload] Inserting image immediately with base64 (${base64.length} bytes)`);
      editorInstance?.chain().insertContent({
        type: 'image',
        attrs: {
          src: base64,
          uploadStatus: 'pending',
          tempId,
        }
      }).run();

      if (currentConvex && currentDocId) {
        console.log(`[handleImageUpload] Adding to upload queue: ${tempId}`);
        initUploadQueue();
        uploadQueue?.add(tempId, file, base64, currentDocId);
      } else {
        console.warn('[handleImageUpload] No Convex client or document ID - image will stay as base64');
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  input.click();
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
