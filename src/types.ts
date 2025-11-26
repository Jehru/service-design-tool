export type Layer = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
};

export type NodeItem = {
  id: string;
  layerId: string;
  x: number;
  y: number;
  text: string;
};

export type HandleDirection = 'top' | 'right' | 'bottom' | 'left';

export type Connection = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromHandle?: HandleDirection;
  toHandle?: HandleDirection;
  label?: string;
};

export type Viewport = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type DiagramState = {
  layers: Layer[];
  nodes: NodeItem[];
  connections: Connection[];
  viewport: Viewport;
};
