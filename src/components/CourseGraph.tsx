import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface GraphData { nodes: Node[]; edges: Edge[]; }

// Sample course data representing a computer science curriculum
const initialNodes: Node[] = [
  {
    id: 'cs101',
    type: 'default',
    position: { x: 100, y: 50 },
    data: { 
      label: 'CS 101\nIntro to Programming',
    },
    style: {
      background: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      border: '2px solid hsl(var(--primary))',
      borderRadius: '8px',
      width: 160,
      fontSize: '12px',
      fontWeight: '500',
    },
  },
  {
    id: 'cs102',
    type: 'default',
    position: { x: 350, y: 50 },
    data: { 
      label: 'CS 102\nData Structures',
    },
    style: {
      background: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      border: '2px solid hsl(var(--primary))',
      borderRadius: '8px',
      width: 160,
      fontSize: '12px',
      fontWeight: '500',
    },
  },
  {
    id: 'cs201',
    type: 'default',
    position: { x: 225, y: 200 },
    data: { 
      label: 'CS 201\nAlgorithms',
    },
    style: {
      background: 'hsl(var(--secondary))',
      color: 'hsl(var(--secondary-foreground))',
      border: '2px solid hsl(var(--secondary))',
      borderRadius: '8px',
      width: 160,
      fontSize: '12px',
      fontWeight: '500',
    },
  },
  {
    id: 'cs301',
    type: 'default',
    position: { x: 100, y: 350 },
    data: { 
      label: 'CS 301\nSoftware Engineering',
    },
    style: {
      background: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))',
      border: '2px solid hsl(var(--accent))',
      borderRadius: '8px',
      width: 160,
      fontSize: '12px',
      fontWeight: '500',
    },
  },
  {
    id: 'cs302',
    type: 'default',
    position: { x: 350, y: 350 },
    data: { 
      label: 'CS 302\nDatabase Systems',
    },
    style: {
      background: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))',
      border: '2px solid hsl(var(--accent))',
      borderRadius: '8px',
      width: 160,
      fontSize: '12px',
      fontWeight: '500',
    },
  },
  {
    id: 'cs401',
    type: 'default',
    position: { x: 225, y: 500 },
    data: { 
      label: 'CS 401\nCapstone Project',
    },
    style: {
      background: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      border: '2px solid hsl(var(--primary))',
      borderRadius: '8px',
      width: 160,
      fontSize: '12px',
      fontWeight: '500',
    },
  },
  {
    id: 'math201',
    type: 'default',
    position: { x: 600, y: 50 },
    data: { 
      label: 'MATH 201\nDiscrete Mathematics',
    },
    style: {
      background: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
      border: '2px solid hsl(var(--border))',
      borderRadius: '8px',
      width: 160,
      fontSize: '12px',
      fontWeight: '500',
    },
  },
  {
    id: 'math301',
    type: 'default',
    position: { x: 600, y: 200 },
    data: { 
      label: 'MATH 301\nStatistics',
    },
    style: {
      background: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
      border: '2px solid hsl(var(--border))',
      borderRadius: '8px',
      width: 160,
      fontSize: '12px',
      fontWeight: '500',
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e101-102',
    source: 'cs101',
    target: 'cs102',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--primary))',
    },
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
  },
  {
    id: 'e102-201',
    source: 'cs102',
    target: 'cs201',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--primary))',
    },
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
  },
  {
    id: 'e201-301',
    source: 'cs201',
    target: 'cs301',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--secondary))',
    },
    style: { stroke: 'hsl(var(--secondary))', strokeWidth: 2 },
  },
  {
    id: 'e201-302',
    source: 'cs201',
    target: 'cs302',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--secondary))',
    },
    style: { stroke: 'hsl(var(--secondary))', strokeWidth: 2 },
  },
  {
    id: 'e301-401',
    source: 'cs301',
    target: 'cs401',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--accent))',
    },
    style: { stroke: 'hsl(var(--accent))', strokeWidth: 2 },
  },
  {
    id: 'e302-401',
    source: 'cs302',
    target: 'cs401',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--accent))',
    },
    style: { stroke: 'hsl(var(--accent))', strokeWidth: 2 },
  },
  {
    id: 'emath201-201',
    source: 'math201',
    target: 'cs201',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--muted-foreground))',
    },
    style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2, strokeDasharray: '5,5' },
  },
  {
    id: 'emath301-302',
    source: 'math301',
    target: 'cs302',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--muted-foreground))',
    },
    style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2, strokeDasharray: '5,5' },
  },
];

interface CourseGraphProps {
  className?: string;
  externalGraph?: GraphData | null; // NEW: allow parent to replace the graph
}

// types you receive from the backend
type BackendGraph = {
  nodes?: Array<{ id: string; label?: string; position?: {x:number;y:number} }>;
  edges?: Array<{ from?: string; to?: string; source?: string; target?: string }>;
};

const toReactFlow = (g: BackendGraph) => {
  // Step 1: Assign layers based on longest path from root
  const layers: Record<string, number> = {};
  const inDegree: Record<string, number> = {};
  const edges = (g.edges ?? []).map(e => ({
    source: String(e.source ?? e.from ?? ""),
    target: String(e.target ?? e.to ?? "")
  }));

  // Calculate in-degrees
  edges.forEach(e => {
    inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    if (!inDegree[e.source]) inDegree[e.source] = 0;
  });

  // Find connected and isolated nodes
  const connectedNodes = new Set<string>();
  edges.forEach(e => {
    connectedNodes.add(e.source);
    connectedNodes.add(e.target);
  });
  
  const isolatedNodes = (g.nodes ?? [])
    .map(n => n.id)
    .filter(id => !connectedNodes.has(String(id)));

  // Find roots (nodes with no incoming edges)
  const roots = Object.keys(inDegree).filter(id => inDegree[id] === 0);

  // Assign layers through BFS
  let queue = roots.map(id => ({ id, layer: 0 }));
  while (queue.length > 0) {
    const { id, layer } = queue.shift()!;
    if (id in layers && layers[id] >= layer) continue;
    layers[id] = layer;
    edges.filter(e => e.source === id)
         .forEach(e => queue.push({ id: e.target, layer: layer + 1 }));
  }

  // Position isolated nodes in their own layer
  isolatedNodes.forEach((id, index) => {
    layers[id] = -1;  // Put isolated nodes in a separate layer
  });

  // Step 2: Position nodes within layers
  const nodesByLayer: Record<number, string[]> = {};
  Object.entries(layers).forEach(([id, layer]) => {
    if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
    nodesByLayer[layer].push(id);
  });

  const layerHeight = 150;
  const layerWidth = 250;

  // Get max connected layer for spacing isolated nodes
  const maxConnectedLayer = Math.max(...Object.values(layers).filter(l => l >= 0));
  const isolatedXOffset = (maxConnectedLayer + 2) * layerWidth; // Put isolated nodes two layers after the last connected layer

  // Create nodes with positions
  const nodes = (g.nodes ?? []).map(n => {
    const layer = layers[n.id] ?? 0;
    const layerNodes = nodesByLayer[layer];
    const index = layerNodes.indexOf(n.id);
    const x = layer === -1 
      ? isolatedXOffset + (layerWidth * index)  // Position isolated nodes far to the right
      : layerWidth * (layer + 1) + 100;  // Connected nodes start one layer to the right
    const y = layer === -1 
      ? layerHeight * index + 100  // Stack isolated nodes vertically
      : (layerHeight * index) + 100;

    return {
      id: String(n.id),
      data: { label: n.label ?? n.id },
      position: n.position ?? { x, y },
      style: {
        background: layer === -1 ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
        color: layer === -1 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
        border: `2px solid ${layer === -1 ? 'hsl(var(--border))' : 'hsl(var(--primary))'}`,
        borderRadius: '8px',
        width: 160,
        fontSize: '12px',
        fontWeight: '500',
      },
    };
  });

  // Create edges
  const flowEdges = edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--primary))',
    },
    style: { 
      stroke: 'hsl(var(--primary))', 
      strokeWidth: 2 
    },
  }));

  return { nodes, edges: flowEdges };
};

// quick detector: are these already React Flow nodes?
const looksLikeFlowNode = (n: any) =>
  n && typeof n.id === "string" && n.position && typeof n.position.x === "number";


const CourseGraph: React.FC<CourseGraphProps> = ({ className, externalGraph }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (!externalGraph) return;

    // If parent already sends RF nodes/edges, keep them.
    // Otherwise, adapt backend {id,label}/{from,to} → RF format.
    const first = externalGraph.nodes?.[0];
    if (first && looksLikeFlowNode(first)) {
      setNodes(externalGraph.nodes as any);
      setEdges(externalGraph.edges as any);
    } else {
      const { nodes, edges } = toReactFlow(externalGraph as any);
      setNodes(nodes);
      setEdges(edges);
    }
  }, [externalGraph, setNodes, setEdges]);


  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--primary))',
        },
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  return (
    <div className={`w-full h-full academic-card ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="rounded-lg"
        style={{ 
          background: 'hsl(var(--background))',
        }}
      >
        <Controls 
          className="bg-card border border-border rounded-md shadow-[var(--shadow-card)]"
        />
        <MiniMap 
          className="bg-card border border-border rounded-md shadow-[var(--shadow-card)]"
          style={{
            backgroundColor: 'hsl(var(--card))',
          }}
        />
        <Background 
          color="hsl(var(--border))" 
          gap={20} 
          size={1}
        />
      </ReactFlow>
    </div>
  );
};

export default CourseGraph;