import { NODE_HEIGHT, NODE_WIDTH } from '../constants';
import { HandleDirection, NodeItem } from '../types';

export const handleOffsets: Record<HandleDirection, { x: number; y: number }> = {
  top: { x: NODE_WIDTH / 2, y: 0 },
  right: { x: NODE_WIDTH, y: NODE_HEIGHT / 2 },
  bottom: { x: NODE_WIDTH / 2, y: NODE_HEIGHT },
  left: { x: 0, y: NODE_HEIGHT / 2 },
};

export const nodeCenter = (node: NodeItem) => ({
  x: node.x + NODE_WIDTH / 2,
  y: node.y + NODE_HEIGHT / 2,
});

export const pickHandleDirection = (from: NodeItem, to: NodeItem): HandleDirection => {
  const fromCenter = nodeCenter(from);
  const toCenter = nodeCenter(to);
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'bottom' : 'top';
};
