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
  onReorderLayer: (id: string, direction: 'up' | 'down') => void;
};

export default function SidebarLayers({
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onRenameLayer,
  onDeleteLayer,
  onToggleVisibility,
  onReorderLayer,
}: Props) {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-header">
          <span>Prototyping land</span>
          <button className="ghost" onClick={onAddLayer} aria-label="Add layer">
            +
          </button>
        </div>
        <div className="sidebar-subtitle">Layers</div>
      </div>
      <div className="layer-list">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`layer-item ${selectedLayerId === layer.id ? 'selected' : ''}`}
            onClick={() => onSelectLayer(layer.id)}
          >
            <div className="layer-row">
              <span className="layer-badge" style={{ background: layer.color }} />
              <input
                className="layer-name"
                value={layer.name}
                onChange={(e) => onRenameLayer(layer.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="layer-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className={`ghost ${layer.visible ? '' : 'muted'}`}
                  onClick={() => onToggleVisibility(layer.id)}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? '👁️' : '🚫'}
                </button>
                <button
                  className="ghost"
                  onClick={() => onReorderLayer(layer.id, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="ghost"
                  onClick={() => onReorderLayer(layer.id, 'down')}
                  disabled={index === layers.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button className="ghost danger" onClick={() => onDeleteLayer(layer.id)} title="Delete layer">
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="ghost" onClick={onAddLayer} aria-label="New layer" style={{ justifyContent: 'center' }}>
        + New layer
      </button>
    </aside>
  );
}
