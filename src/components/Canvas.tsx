import React, { useEffect, useRef, useState } from 'react';
import { Connection, ConnectionHandle, Layer, NodeItem, Viewport } from '../types';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 120;

type Props = {
  layers: Layer[];
  nodes: NodeItem[];
  allNodes: NodeItem[];
  connections: Connection[];
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  viewport: Viewport;
  activeConnectionDrag: {
    fromNodeId: string;
    handle: ConnectionHandle;
    cursor: { x: number; y: number };
  } | null;
  onNodeClick: (id: string) => void;
  onNodeDrag: (id: string, x: number, y: number) => void;
  onNodeTextChange: (id: string, text: string) => void;
  onConnectionClick: (id: string) => void;
  onViewportChange: (viewport: Viewport) => void;
  onDeselect: () => void;
  onWheelZoom: (delta: number, anchor: { x: number; y: number }) => void;
  onStartConnection: (fromNodeId: string, handle: ConnectionHandle, cursor: { x: number; y: number }) => void;
  onUpdateConnectionCursor: (cursor: { x: number; y: number }) => void;
  onCancelConnection: () => void;
};

export default function Canvas({
  layers,
  nodes,
  allNodes,
  connections,
  selectedNodeId,
  selectedConnectionId,
  viewport,
  activeConnectionDrag,
  onNodeClick,
  onNodeDrag,
  onNodeTextChange,
  onConnectionClick,
  onViewportChange,
  onDeselect,
  onWheelZoom,
  onStartConnection,
  onUpdateConnectionCursor,
  onCancelConnection,
}: Props) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => {
      setDraggingNodeId(null);
      setDragStart(null);
      setPanning(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const getLayerColor = (layerId: string) => layers.find((l) => l.id === layerId)?.color ?? '#999';

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.type === 'node') return;
    setPanning(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    onDeselect();
    onCancelConnection();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId && dragStart) {
      const dx = (e.clientX - dragStart.x) / viewport.scale;
      const dy = (e.clientY - dragStart.y) / viewport.scale;
      const node = nodes.find((n) => n.id === draggingNodeId);
      if (!node) return;
      onNodeDrag(node.id, node.x + dx, node.y + dy);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (panning && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      onViewportChange({ ...viewport, offsetX: viewport.offsetX + dx, offsetY: viewport.offsetY + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (activeConnectionDrag) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      onUpdateConnectionCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingNodeId(id);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      onWheelZoom(delta, anchor);
    }
  };

  const nodePosition = (node: NodeItem) => ({
    x: node.x * viewport.scale + viewport.offsetX,
    y: node.y * viewport.scale + viewport.offsetY,
  });

  const handlePosition = (handle: ConnectionHandle) => {
    switch (handle) {
      case 'top':
        return { x: NODE_WIDTH / 2, y: 0 };
      case 'right':
        return { x: NODE_WIDTH, y: NODE_HEIGHT / 2 };
      case 'bottom':
        return { x: NODE_WIDTH / 2, y: NODE_HEIGHT };
      case 'left':
      default:
        return { x: 0, y: NODE_HEIGHT / 2 };
    }
  };

  const connectionPoints = (connection: Connection) => {
    const fromNode = allNodes.find((n) => n.id === connection.fromNodeId);
    const toNode = allNodes.find((n) => n.id === connection.toNodeId);
    if (!fromNode || !toNode) return null;
    const fromPos = nodePosition(fromNode);
    const toPos = nodePosition(toNode);
    return {
      x1: fromPos.x + NODE_WIDTH / 2,
      y1: fromPos.y + NODE_HEIGHT / 2,
      x2: toPos.x + NODE_WIDTH / 2,
      y2: toPos.y + NODE_HEIGHT / 2,
    };
  };

  return (
    <div
      className="canvas"
      ref={canvasRef}
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
    >
      <div className="grid" style={{ transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})` }} />
      <svg className="connections">
        {connections.map((connection) => {
          const points = connectionPoints(connection);
          if (!points) return null;
          const isSelected = selectedConnectionId === connection.id;
          return (
            <line
              key={connection.id}
              x1={points.x1}
              y1={points.y1}
              x2={points.x2}
              y2={points.y2}
              stroke="#111827"
              strokeWidth={isSelected ? 3 : 2}
              markerEnd="url(#arrow)"
              onClick={(e) => {
                e.stopPropagation();
                onConnectionClick(connection.id);
              }}
            />
          );
        })}
        {activeConnectionDrag && (() => {
          const fromNode = allNodes.find((n) => n.id === activeConnectionDrag.fromNodeId);
          if (!fromNode) return null;
          const fromPos = nodePosition(fromNode);
          const anchorOffset = handlePosition(activeConnectionDrag.handle);
          return (
            <line
              x1={fromPos.x + anchorOffset.x}
              y1={fromPos.y + anchorOffset.y}
              x2={activeConnectionDrag.cursor.x}
              y2={activeConnectionDrag.cursor.y}
              stroke="#111827"
              strokeWidth={2}
              strokeDasharray="6 6"
              opacity={0.5}
              pointerEvents="none"
            />
          );
        })()}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#111827" />
          </marker>
        </defs>
      </svg>
      <div className="nodes">
        {nodes.map((node) => {
          const { x, y } = nodePosition(node);
          const isSelected = selectedNodeId === node.id;
          const isEditing = editingNodeId === node.id;
          const startConnection = (e: React.MouseEvent, handle: ConnectionHandle) => {
            e.stopPropagation();
            e.preventDefault();
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            onStartConnection(node.id, handle, { x: e.clientX - rect.left, y: e.clientY - rect.top });
          };
          return (
            <div
              key={node.id}
              className={`node ${isSelected ? 'selected' : ''}`}
              data-type="node"
              tabIndex={0}
              style={{ transform: `translate(${x}px, ${y}px)`, borderColor: getLayerColor(node.layerId) }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => {
                e.stopPropagation();
                onNodeClick(node.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingNodeId(node.id);
              }}
            >
              <div className="node-header" style={{ background: getLayerColor(node.layerId) }} />
              {isEditing ? (
                <textarea
                  autoFocus
                  className="node-textarea"
                  value={node.text}
                  onChange={(e) => onNodeTextChange(node.id, e.target.value)}
                  onBlur={() => setEditingNodeId(null)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="node-body">{node.text || 'Double click to edit'}</div>
              )}
              <div className="connection-handles">
                {(['top', 'right', 'bottom', 'left'] as ConnectionHandle[]).map((handle) => (
                  <button
                    key={handle}
                    className={`connection-handle ${handle}`}
                    aria-label={`Start connection from ${handle} handle`}
                    onMouseDown={(e) => startConnection(e, handle)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
