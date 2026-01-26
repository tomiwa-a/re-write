import { FC } from 'react';

interface ERDSidebarProps {
  node: any;
  onUpdate: (data: any) => void;
}

export const ERDSidebar: FC<ERDSidebarProps> = ({ node, onUpdate }) => {
  const data = node.data;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...data, label: e.target.value });
  };

  const handleColumnChange = (idx: number, field: string, value: any) => {
    const newColumns = [...data.columns];
    newColumns[idx] = { ...newColumns[idx], [field]: value };
    onUpdate({ ...data, columns: newColumns });
  };

  const addColumn = () => {
    const newColumns = [...data.columns, { name: 'new_col', type: 'varchar' }];
    onUpdate({ ...data, columns: newColumns });
  };

  const removeColumn = (idx: number) => {
    const newColumns = data.columns.filter((_: any, i: number) => i !== idx);
    onUpdate({ ...data, columns: newColumns });
  };

  return (
    <div className="erd-sidebar">
      <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Table Properties</h3>
      
      <div className="erd-form-section">
        <label className="erd-form-label">Table Name</label>
        <input 
          className="erd-input" 
          value={data.label} 
          onChange={handleNameChange}
          spellCheck={false}
        />
      </div>

      <div className="erd-form-section">
        <label className="erd-form-label">Columns</label>
        {data.columns.map((col: any, idx: number) => (
          <div key={idx} className="column-editor-item">
            <input 
              className="erd-input" 
              style={{ flex: 2 }}
              value={col.name} 
              onChange={(e) => handleColumnChange(idx, 'name', e.target.value)}
              placeholder="Name"
              spellCheck={false}
            />
            <select 
              className="erd-input" 
              style={{ flex: 1, padding: '8px' }}
              value={col.type}
              onChange={(e) => handleColumnChange(idx, 'type', e.target.value)}
            >
              <option value="integer">int</option>
              <option value="varchar">varchar</option>
              <option value="text">text</option>
              <option value="boolean">bool</option>
              <option value="timestamp">time</option>
            </select>
            <button 
              onClick={() => removeColumn(idx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
            >
              ×
            </button>
          </div>
        ))}
        
        <button className="btn-add-column" onClick={addColumn}>
          + Add Column
        </button>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '20px', fontSize: '0.8rem', color: '#94a3b8' }}>
        Tip: Drag from handles to create relationships.
      </div>
    </div>
  );
};
