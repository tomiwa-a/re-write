import { createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ERDEditor } from './ERD/ERDEditor';

let reactRoot: Root | null = null;

export function mountERD(container: HTMLElement, props: { initialContent: any, onChange: (content: any) => void }) {
    if (!reactRoot) {
        reactRoot = createRoot(container);
    }
    reactRoot.render(createElement(ERDEditor, props));
}

export function unmountERD() {
    if (reactRoot) {
        reactRoot.unmount();
        reactRoot = null;
    }
}
