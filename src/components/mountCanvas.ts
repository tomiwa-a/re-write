import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CanvasEditor } from './CanvasEditor';

let reactRoot: Root | null = null;

export function mountCanvas(container: HTMLElement, props: any = {}) {
    if (!reactRoot) {
        reactRoot = createRoot(container);
    }
    reactRoot.render(React.createElement(CanvasEditor, props));
}

export function unmountCanvas() {
    if (reactRoot) {
        reactRoot.unmount();
        reactRoot = null;
    }
}
