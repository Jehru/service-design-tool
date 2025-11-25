import React from 'react';

const presetOptions = [
  { label: 'Service Blueprint (3 layers)', value: 'blueprint' },
  { label: 'Journey map (2 layers)', value: 'journey' },
];

type Props = {
  connectMode: boolean;
  onToggleConnectMode: () => void;
  onAddNode: () => void;
  onApplyPreset: (value: string) => void;
};

export default function Toolbar({
  connectMode,
  onToggleConnectMode,
  onAddNode,
  onApplyPreset,
}: Props) {
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
    </div>
  );
}
