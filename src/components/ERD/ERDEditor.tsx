import { useState, useCallback, useEffect } from 'react';
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
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

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
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
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
    setSelectedNode(newNode);
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
    // Update selected node state too
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, data: newData });
    }
  };

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
        </ReactFlow>
      </div>

      {selectedNode && (
        <ERDSidebar 
          node={selectedNode} 
          onUpdate={(data) => updateNodeData(selectedNode.id, data)}
        />
      )}
    </div>
  );
};
