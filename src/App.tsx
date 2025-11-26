/**
 * README (quickstart)
 * Run: npm install && npm run dev
 * Usage: use the left sidebar to manage layers (add/rename/delete/toggle visibility). Select a layer, then use "Add node" in the top toolbar to create sticky notes on that layer. Drag nodes to reposition them on the canvas. Toggle "Connect mode" to click two nodes and create a connection line. Use Ctrl + mouse wheel on the canvas to zoom/pan.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import SidebarLayers from './components/SidebarLayers';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import { Connection, Layer, NodeItem, Viewport } from './types';
import './styles.css';

const defaultLayers: Layer[] = [
  { id: 'customer', name: 'Customer actions', color: '#f59e0b', visible: true },
  { id: 'frontstage', name: 'Frontstage (product / UI)', color: '#3b82f6', visible: true },
  { id: 'backstage', name: 'Backstage / internal actions', color: '#10b981', visible: true },
];

const initialViewport: Viewport = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

function randomColor() {
  const colors = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#eab308'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function App() {
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>(defaultLayers[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [pendingFromNode, setPendingFromNode] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>(initialViewport);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        if (selectedNodeId) {
          setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
          setConnections((prev) => prev.filter((c) => c.fromNodeId !== selectedNodeId && c.toNodeId !== selectedNodeId));
          setSelectedNodeId(null);
        } else if (selectedConnectionId) {
          setConnections((prev) => prev.filter((c) => c.id !== selectedConnectionId));
          setSelectedConnectionId(null);
        }
      }
      if (ev.key === 'Escape') {
        setConnectMode(false);
        setPendingFromNode(null);
        setSelectedNodeId(null);
        setSelectedConnectionId(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedNodeId, selectedConnectionId]);

  const visibleLayerIds = useMemo(() => new Set(layers.filter((l) => l.visible).map((l) => l.id)), [layers]);

  const handleAddLayer = () => {
    const id = crypto.randomUUID();
    const newLayer: Layer = { id, name: `Layer ${layers.length + 1}`, color: randomColor(), visible: true };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(id);
  };

  const handleRenameLayer = (id: string, name: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
  };

  const handleDeleteLayer = (id: string) => {
    const remaining = layers.filter((l) => l.id !== id);
    if (!remaining.length) return;
    const remainingNodes = nodes.filter((n) => n.layerId !== id);
    const validNodeIds = new Set(remainingNodes.map((n) => n.id));
    setLayers(remaining);
    setNodes(remainingNodes);
    setConnections((prev) => prev.filter((c) => validNodeIds.has(c.fromNodeId) && validNodeIds.has(c.toNodeId)));
    const nextSelected = remaining[0].id;
    setSelectedLayerId(nextSelected);
  };

  const handleToggleLayerVisibility = (id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  };

  const handleAddNode = () => {
    const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? layers[0];
    if (!selectedLayer) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : 400;
    const centerY = rect ? rect.height / 2 : 300;
    const canvasX = (centerX - viewport.offsetX) / viewport.scale;
    const canvasY = (centerY - viewport.offsetY) / viewport.scale;
    const node: NodeItem = {
      id: crypto.randomUUID(),
      layerId: selectedLayer.id,
      x: canvasX,
      y: canvasY,
      text: 'New node',
    };
    setNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
  };

  const handleUpdateNodePosition = (id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const handleUpdateNodeText = (id: string, text: string) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  };

  const handleSelectNode = (id: string | null) => {
    setSelectedConnectionId(null);
    setSelectedNodeId(id);
  };

  const handleSelectConnection = (id: string) => {
    setSelectedNodeId(null);
    setSelectedConnectionId(id);
  };

  const handleCreateConnection = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const exists = connections.some((c) => c.fromNodeId === fromId && c.toNodeId === toId);
    if (exists) return;
    const connection: Connection = { id: crypto.randomUUID(), fromNodeId: fromId, toNodeId: toId };
    setConnections((prev) => [...prev, connection]);
  };

  const handleCanvasNodeClick = (id: string) => {
    if (!connectMode) {
      handleSelectNode(id);
      return;
    }

    if (!pendingFromNode) {
      setPendingFromNode(id);
      handleSelectNode(id);
      return;
    }

    if (pendingFromNode === id) {
      setPendingFromNode(id);
      handleSelectNode(id);
      return;
    }

    handleCreateConnection(pendingFromNode, id);
    setPendingFromNode(id);
    handleSelectNode(id);
  };

  const handleZoom = (delta: number, anchor?: { x: number; y: number }) => {
    setViewport((prev) => {
      const newScale = Math.min(Math.max(prev.scale + delta, 0.3), 2.5);
      if (!anchor) return { ...prev, scale: newScale };
      const canvasX = (anchor.x - prev.offsetX) / prev.scale;
      const canvasY = (anchor.y - prev.offsetY) / prev.scale;
      return {
        scale: newScale,
        offsetX: anchor.x - canvasX * newScale,
        offsetY: anchor.y - canvasY * newScale,
      };
    });
  };

  const visibleNodes = nodes.filter((n) => visibleLayerIds.has(n.layerId));
  const visibleConnections = connections.filter((c) => {
    const fromLayer = nodes.find((n) => n.id === c.fromNodeId)?.layerId;
    const toLayer = nodes.find((n) => n.id === c.toNodeId)?.layerId;
    return fromLayer && toLayer && visibleLayerIds.has(fromLayer) && visibleLayerIds.has(toLayer);
  });

  return (
    <div className="app" ref={containerRef}>
      <SidebarLayers
        layers={layers}
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
        onAddLayer={handleAddLayer}
        onRenameLayer={handleRenameLayer}
        onDeleteLayer={handleDeleteLayer}
        onToggleVisibility={handleToggleLayerVisibility}
      />
      <div className="main">
        <Toolbar
          connectMode={connectMode}
          onToggleConnectMode={() => {
            setSelectedConnectionId(null);
            setPendingFromNode(null);
            setConnectMode((prev) => !prev);
          }}
          onAddNode={handleAddNode}
        />
        <Canvas
          layers={layers}
          nodes={visibleNodes}
          allNodes={nodes}
          connections={visibleConnections}
          selectedNodeId={selectedNodeId}
          selectedConnectionId={selectedConnectionId}
          viewport={viewport}
          onNodeClick={handleCanvasNodeClick}
          onNodeDrag={handleUpdateNodePosition}
          onNodeTextChange={handleUpdateNodeText}
          onConnectionClick={handleSelectConnection}
          onViewportChange={setViewport}
          onDeselect={() => {
            setSelectedNodeId(null);
            setSelectedConnectionId(null);
            setPendingFromNode(null);
          }}
          onWheelZoom={(delta, anchor) => handleZoom(delta, anchor)}
        />
      </div>
    </div>
  );
}

export default App;
