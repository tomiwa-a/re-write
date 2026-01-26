import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

interface CanvasEditorProps {
    initialContent?: any
    onChange?: (content: any) => void
    readOnly?: boolean
}

export function CanvasEditor({ initialContent, onChange, readOnly = false }: CanvasEditorProps) {
    
    
    return (
        <div className="canvas-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Tldraw 
                onMount={(editor) => {
                    if (initialContent) {
                        try {
                            editor.loadSnapshot(initialContent)
                        } catch (e) {
                            console.error('Failed to load canvas content', e);
                        }
                    }
                    
                    if (readOnly) {
                        editor.updateInstanceState({ isReadonly: true });
                    }

                    // simple change listener
                    editor.sideEffects.registerAfterChangeHandler('shape', () => {
                        const snapshot = editor.getSnapshot();
                        if (onChange) onChange(snapshot);
                    });
                }}
            />
        </div>
    )
}
