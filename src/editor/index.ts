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
import { OptimisticImage } from "./extensions/OptimisticImage";
import { ImageUploadQueue } from "../lib/ImageUploadQueue";
import { v4 as uuidv4 } from 'uuid';
import { createToolbar } from "./components/Toolbar";
import { BubbleMenu } from "@tiptap/extension-bubble-menu";
import { createTableBubbleMenuElement, setupTableBubbleMenu } from "./components/TableBubbleMenu";
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import { Mathematics } from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';



import { Extension, InputRule } from "@tiptap/core";
import { openMathModal } from "./components/MathModal";


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
      if (!editorInstance || editorInstance.isDestroyed) return;
      
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
    
    uploadQueue.restore();
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
    
    const existingCount = document.querySelector('.character-count');
    if (existingCount) existingCount.remove();
  }

  setupRightPaneToggle();
  
  // Create table menu element
  const tableMenuElement = createTableBubbleMenuElement();

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
      BubbleMenu.configure({
        pluginKey: 'tableBubbleMenu',
        element: tableMenuElement,
        shouldShow: ({ editor }) => {
          return editor.isActive('table');
        },
      }),
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
      CharacterCount,
      Typography,
      Mathematics.configure({
        inlineOptions: {
          onClick: (node: any, pos: any) => {
            openMathModal(node.attrs.latex, (latex) => {
               if (editorInstance) {
                 editorInstance.chain()
                   .setNodeSelection(pos)
                   .updateAttributes('inlineMath', { latex })
                   .setTextSelection(pos + node.nodeSize)
                   .focus()
                   .run()
               }
            });
          },
        },
        blockOptions: {
          onClick: (node: any, pos: any) => {
            openMathModal(node.attrs.latex, (latex) => {
               if (editorInstance) {
                 editorInstance.chain()
                   .setNodeSelection(pos)
                   .updateAttributes('blockMath', { latex })
                   .setTextSelection(pos + node.nodeSize)
                   .focus()
                   .run()
               }
            });
          },
        },
        katexOptions: {
          throwOnError: false,
        },
      }),
      Extension.create({
        name: 'mathInputRule',
        addInputRules() {
          return [
            new InputRule({
              find: /(?<!\$)\$(?!\$)([^\$]+)(?<!\$)\$(?!\$)/,
              handler: ({ state, range, match }) => {
                const { tr } = state
                const start = range.from
                const end = range.to
                const latex = match[1]
                
                if (latex && latex.trim()) {
                   tr.replaceWith(start, end, this.editor.schema.nodes.inlineMath.create({ latex }))
                }
              }
            })
          ]
        }
      }),
      ...extraExtensions,
    ],
    content: initialContent,
    autofocus: true,
    editable: true,
  });

  // Setup listeners and additional logic
  setupTableBubbleMenu(tableMenuElement, editorInstance);


  // Create and append character count element
  const characterCountElement = document.createElement('div');
  characterCountElement.className = 'character-count';
  characterCountElement.textContent = '0 words | 0 characters';
  document.body.appendChild(characterCountElement); 

  editorInstance.on('update', ({ transaction, editor }) => {
    // Update character count
    const wordCount = editor.storage.characterCount.words();
    const characterCount = editor.storage.characterCount.characters();
    characterCountElement.textContent = `${wordCount} words | ${characterCount} characters`;

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


  const handleImageUpload = () => {
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
  };

  // Setup toolbar
  if (toolbarElement) {
    toolbarElement.innerHTML = '';
    const newToolbar = createToolbar(editorInstance, handleImageUpload);
    toolbarElement.appendChild(newToolbar);
  }

  return editorInstance;
}

// setupToolbar, handleLink, handleImageUpload, and updateToolbarState have been moved to ./components/Toolbar.ts

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
