import { useState } from 'react';
import { Layer } from '../types';
import '../styles.css';

type Props = {
  layers: Layer[];
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onRenameLayer: (id: string, name: string) => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
};

export default function SidebarLayers({
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onRenameLayer,
  onDeleteLayer,
  onToggleVisibility,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <aside className="sidebar minimal">
      <div className="sidebar-header simple">
        <div>
          <p className="sidebar-label">Layers</p>
          <h2>Layers</h2>
        </div>
        <button className="ghost add" onClick={onAddLayer} aria-label="Add layer">
          +
        </button>
      </div>
      <div className="layer-list stripped">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`layer-item compact ${selectedLayerId === layer.id ? 'selected' : ''}`}
            onClick={() => onSelectLayer(layer.id)}
          >
            <button
              className={`layer-visibility ${layer.visible ? '' : 'off'}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
              aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
            >
              {layer.visible ? '👁' : '⛶'}
            </button>
            {editingId === layer.id ? (
              <input
                className="layer-name-display"
                value={layer.name}
                onChange={(e) => onRenameLayer(layer.id, e.target.value)}
                onBlur={() => setEditingId(null)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <div
                className="layer-name-text"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingId(layer.id);
                }}
              >
                {layer.name || 'Layer'}
              </div>
            )}
            <button
              className="layer-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLayer(layer.id);
              }}
              aria-label="Delete layer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
