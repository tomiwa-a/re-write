import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const TableNode = memo(({ data, selected }: any) => {
  return (
    <div className={`table-node ${selected ? 'selected' : ''}`}>
      <div className="table-node-header">
        <span>{data.label}</span>
      </div>
      <div className="table-node-content">
        {data.columns.map((col: any, idx: number) => (
          <div key={idx} className="table-column">
            {/* Left handle for incoming relationships */}
            <Handle
              type="target"
              position={Position.Left}
              id={`target-${idx}`}
              style={{ top: '50%', background: '#94a3b8' }}
            />
            
            <div className="column-name">
              {col.isPk && <span className="pk-icon">🔑</span>}
              {col.name}
            </div>
            <div className="column-type">{col.type}</div>

            {/* Right handle for outgoing relationships */}
            <Handle
              type="source"
              position={Position.Right}
              id={`source-${idx}`}
              style={{ top: '50%', background: '#94a3b8' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

TableNode.displayName = 'TableNode';
