import React from 'react';

type Props = {
  connectMode: boolean;
  onToggleConnectMode: () => void;
  onAddNode: () => void;
};

export default function Toolbar({
  connectMode,
  onToggleConnectMode,
  onAddNode,
}: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button onClick={onAddNode}>Add node</button>
        <button className={connectMode ? 'active' : ''} onClick={onToggleConnectMode}>
          {connectMode ? 'Connecting…' : 'Connect mode'}
        </button>
      </div>
      <div className="toolbar-right">
        <span style={{ opacity: 0.7 }}>Ready to connect layers</span>
      </div>
    </div>
  );
}
