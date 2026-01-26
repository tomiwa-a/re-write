import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CanvasEditor } from './CanvasEditor';

let reactRoot: Root | null = null;

export function mountCanvas(container: HTMLElement, props: any = {}) {
    if (!reactRoot) {
        reactRoot = createRoot(container);
    }
    
    // Check if we are re-mounting on the same container? 
    // CreateRoot should only be called once per container.
    // Since our app might switch views, we might need to unmount.
    
    // Actually, createRoot on a new container is fine. 
    // If container changes, we need new root.
    // For now, let's assume one container for canvas.
    
    // If reactRoot exists but container is different, we should probably handle that.
    // But simplified:
    
    reactRoot.render(React.createElement(CanvasEditor, props));
}

export function unmountCanvas() {
    if (reactRoot) {
        reactRoot.unmount();
        reactRoot = null;
    }
}
