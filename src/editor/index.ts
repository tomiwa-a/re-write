import { Editor } from "@tiptap/core";
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'

let editorInstance: Editor | null = null;

export function initEditor(element: HTMLElement): Editor {
  if (editorInstance) {
    editorInstance.destroy();
  }

  editorInstance = new Editor({
    element,
    extensions: [Document, Paragraph, Text],
    content: "",
    autofocus: true,
    editable: true,
    // editorProps: {
    //   attributes: {
    //     class: "tiptap-editor",
    //   },
    // },
  });

  return editorInstance;
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
  return editorInstance?.getJSON() as Record<string, unknown> || {};
}
