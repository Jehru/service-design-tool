import React from 'react';
import { DiagramState } from '../types';

const presetOptions = [
  { label: 'Service Blueprint (3 layers)', value: 'blueprint' },
  { label: 'Journey map (2 layers)', value: 'journey' },
];

type Props = {
  connectMode: boolean;
  onToggleConnectMode: () => void;
  onAddNode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onExport: () => void;
  onImport: (data: DiagramState) => void;
  onApplyPreset: (value: string) => void;
};

export default function Toolbar({
  connectMode,
  onToggleConnectMode,
  onAddNode,
  onZoomIn,
  onZoomOut,
  onResetView,
  onExport,
  onImport,
  onApplyPreset,
}: Props) {
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        onImport(data);
      } catch (err) {
        console.error('Failed to import', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button onClick={onAddNode}>Add node</button>
        <button className={connectMode ? 'active' : ''} onClick={onToggleConnectMode}>
          {connectMode ? 'Connecting…' : 'Connect mode'}
        </button>
        <div className="preset">
          <label htmlFor="preset">Preset:</label>
          <select id="preset" onChange={(e) => onApplyPreset(e.target.value)} defaultValue="">
            <option value="" disabled>
              Choose
            </option>
            {presetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="toolbar-right">
        <div className="zoom-controls">
          <button onClick={onZoomOut}>-</button>
          <button onClick={onResetView}>Reset</button>
          <button onClick={onZoomIn}>+</button>
        </div>
        <button onClick={onExport}>Export JSON</button>
        <label className="import-label">
          Import JSON
          <input type="file" accept="application/json" onChange={handleImportFile} />
        </label>
      </div>
    </div>
  );
}
