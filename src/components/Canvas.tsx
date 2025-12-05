import React, { useEffect, useRef, useState } from 'react';
import { NODE_HEIGHT, NODE_WIDTH } from '../constants';
import { Connection, HandleDirection, Layer, NodeItem, Viewport } from '../types';
import { handleOffsets, pickHandleDirection } from '../utils/handles';

type Props = {
  layers: Layer[];
  nodes: NodeItem[];
  allNodes: NodeItem[];
  connections: Connection[];
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  viewport: Viewport;
  onNodeClick: (id: string) => void;
  onNodeDrag: (id: string, x: number, y: number) => void;
  onNodeTextChange: (id: string, text: string) => void;
  onConnectionClick: (id: string) => void;
  onViewportChange: (viewport: Viewport) => void;
  onDeselect: () => void;
  onWheelZoom: (delta: number, anchor: { x: number; y: number }) => void;
};

export default function Canvas({
  layers,
  nodes,
  allNodes,
  connections,
  selectedNodeId,
  selectedConnectionId,
  viewport,
  onNodeClick,
  onNodeDrag,
  onNodeTextChange,
  onConnectionClick,
  onViewportChange,
  onDeselect,
  onWheelZoom,
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

  const getLayerName = (layerId: string) => layers.find((l) => l.id === layerId)?.name ?? 'Layer';

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.type === 'node') return;
    setPanning(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    onDeselect();
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

  const scaledHandleOffset = (handle: HandleDirection) => ({
    x: handleOffsets[handle].x * viewport.scale,
    y: handleOffsets[handle].y * viewport.scale,
  });

  const connectionPoints = (connection: Connection) => {
    const fromNode = allNodes.find((n) => n.id === connection.fromNodeId);
    const toNode = allNodes.find((n) => n.id === connection.toNodeId);
    if (!fromNode || !toNode) return null;
    const fromPos = nodePosition(fromNode);
    const toPos = nodePosition(toNode);
    const fromHandle = connection.fromHandle ?? pickHandleDirection(fromNode, toNode);
    const toHandle = connection.toHandle ?? pickHandleDirection(toNode, fromNode);
    const fromOffset = scaledHandleOffset(fromHandle);
    const toOffset = scaledHandleOffset(toHandle);
    return {
      x1: fromPos.x + fromOffset.x,
      y1: fromPos.y + fromOffset.y,
      x2: toPos.x + toOffset.x,
      y2: toPos.y + toOffset.y,
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
          return (
            <div
              key={node.id}
              className={`node ${isSelected ? 'selected' : ''}`}
              data-type="node"
              style={{ transform: `translate(${x}px, ${y}px)` }}
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
              <div className="node-label-row">
                <span className="node-layer-chip">{getLayerName(node.layerId)}</span>
              </div>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
