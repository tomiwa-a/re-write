import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  applyEdgeChanges, 
  applyNodeChanges,
  addEdge,
  Panel,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../../styles/erd.css';
import { TableNode } from './TableNode';
import { ERDSidebar } from './ERDSidebar';

const nodeTypes = {
  table: TableNode,
};

interface ERDEditorProps {
  initialContent?: any;
  onChange: (content: any) => void;
}

export const ERDEditor: React.FC<ERDEditorProps> = ({ initialContent, onChange }) => {
  const [nodes, setNodes] = useState<Node[]>(initialContent?.nodes || []);
  const [edges, setEdges] = useState<Edge[]>(initialContent?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Floating widget state
  const [sidebarPos, setSidebarPos] = useState({ x: 200, y: 50 }); // Moved it slightly so it doesn't block top-left buttons
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Save changes
  useEffect(() => {
    onChange({ nodes, edges });
  }, [nodes, edges]);

  const addTable = () => {
    const id = `table_${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'table',
      position: { x: 100, y: 100 },
      data: { 
        label: 'new_table',
        columns: [
          { name: 'id', type: 'integer', isPk: true },
        ]
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(id);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: newData };
        }
        return node;
      })
    );
  };

  // Draggable logic for sidebar
  const onSidebarMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.draggable-handle')) {
        setIsDraggingSidebar(true);
        dragOffset.current = {
            x: e.clientX - sidebarPos.x,
            y: e.clientY - sidebarPos.y
        };
        e.stopPropagation();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (isDraggingSidebar) {
            setSidebarPos({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        }
    };
    const handleMouseUp = () => setIsDraggingSidebar(false);

    if (isDraggingSidebar) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar]);

  return (
    <div className="erd-container">
      <div className="erd-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
        >
          <Background color="#cbd5e1" gap={20} />
          <Controls />
          <Panel position="top-left">
            <button className="btn-primary" onClick={addTable} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              + Add Table
            </button>
          </Panel>

          {selectedNode && (
            <div 
              style={{ 
                position: 'absolute', 
                left: sidebarPos.x, 
                top: sidebarPos.y,
                zIndex: 1000
              }}
              onMouseDown={onSidebarMouseDown}
            >
              <ERDSidebar 
                node={selectedNode} 
                onUpdate={(data) => updateNodeData(selectedNode.id, data)}
                onClose={() => setSelectedNodeId(null)}
              />
            </div>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

