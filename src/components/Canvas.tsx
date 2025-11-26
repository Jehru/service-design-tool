import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Connection, Layer, NodeItem, Viewport } from '../types';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 120;

type Props = {
  layers: Layer[];
  nodes: NodeItem[];
  allNodes: NodeItem[];
  connections: Connection[];
  connectMode: boolean;
  pendingFromNodeId: string | null;
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  viewport: Viewport;
  onNodeClick: (id: string) => void;
  onNodeDrag: (id: string, x: number, y: number) => void;
  onNodeTextChange: (id: string, text: string) => void;
  onConnectionClick: (id: string) => void;
  onCreateLooseConnection: (fromId: string, point: { x: number; y: number }) => void;
  onLooseConnectionDrag: (id: string, point: { x: number; y: number }) => void;
  onLooseConnectionFinalize: (id: string, nodeId: string) => void;
  onViewportChange: (viewport: Viewport) => void;
  onDeselect: () => void;
  onWheelZoom: (delta: number, anchor: { x: number; y: number }) => void;
};

export default function Canvas({
  layers,
  nodes,
  allNodes,
  connections,
  connectMode,
  pendingFromNodeId,
  selectedNodeId,
  selectedConnectionId,
  viewport,
  onNodeClick,
  onNodeDrag,
  onNodeTextChange,
  onConnectionClick,
  onCreateLooseConnection,
  onLooseConnectionDrag,
  onLooseConnectionFinalize,
  onViewportChange,
  onDeselect,
  onWheelZoom,
}: Props) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingLooseConnectionId, setDraggingLooseConnectionId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);

  const clientToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - viewport.offsetX) / viewport.scale,
        y: (clientY - rect.top - viewport.offsetY) / viewport.scale,
      };
    },
    [viewport.offsetX, viewport.offsetY, viewport.scale],
  );

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (draggingLooseConnectionId) {
        const nodeId = (e.target as HTMLElement | null)?.closest?.('[data-node-id]')?.getAttribute('data-node-id');
        const point = clientToCanvas(e.clientX, e.clientY);
        if (nodeId) {
          onLooseConnectionFinalize(draggingLooseConnectionId, nodeId);
        } else {
          onLooseConnectionDrag(draggingLooseConnectionId, point);
        }
        setDraggingLooseConnectionId(null);
      }
      setDraggingNodeId(null);
      setDragStart(null);
      setPanning(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [clientToCanvas, draggingLooseConnectionId, onLooseConnectionDrag, onLooseConnectionFinalize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDraggingLooseConnectionId(null);
        setDraggingNodeId(null);
        setDragStart(null);
        setPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getLayerColor = (layerId: string) => layers.find((l) => l.id === layerId)?.color ?? '#999';

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    const targetType = (e.target as HTMLElement).dataset.type;
    if (targetType === 'node' || targetType === 'connection' || targetType === 'connection-handle') return;
    if (connectMode && pendingFromNodeId) {
      const point = clientToCanvas(e.clientX, e.clientY);
      onCreateLooseConnection(pendingFromNodeId, point);
      return;
    }
    setPanning(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    onDeselect();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingLooseConnectionId) {
      const point = clientToCanvas(e.clientX, e.clientY);
      onLooseConnectionDrag(draggingLooseConnectionId, point);
      return;
    }
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

  const connectionPoints = (connection: Connection) => {
    const fromNode = allNodes.find((n) => n.id === connection.fromNodeId);
    if (!fromNode) return null;
    const fromPos = nodePosition(fromNode);
    const toNode = connection.toNodeId ? allNodes.find((n) => n.id === connection.toNodeId) : null;
    if (connection.toNodeId) {
      if (!toNode) return null;
      const toPos = nodePosition(toNode);
      return {
        x1: fromPos.x + NODE_WIDTH / 2,
        y1: fromPos.y + NODE_HEIGHT / 2,
        x2: toPos.x + NODE_WIDTH / 2,
        y2: toPos.y + NODE_HEIGHT / 2,
        loose: false,
      };
    }
    if (connection.looseEnd) {
      return {
        x1: fromPos.x + NODE_WIDTH / 2,
        y1: fromPos.y + NODE_HEIGHT / 2,
        x2: connection.looseEnd.x * viewport.scale + viewport.offsetX,
        y2: connection.looseEnd.y * viewport.scale + viewport.offsetY,
        loose: true,
      };
    }
    return null;
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
            <g key={connection.id}>
              <line
                data-type="connection"
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
              {points.loose && connection.looseEnd && (
                <circle
                  className="connection-handle"
                  data-type="connection-handle"
                  cx={points.x2}
                  cy={points.y2}
                  r={8}
                  fill="#111827"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingLooseConnectionId(connection.id);
                    onConnectionClick(connection.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </g>
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
              data-node-id={node.id}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
