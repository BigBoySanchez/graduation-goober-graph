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

const CourseGraph: React.FC<CourseGraphProps> = ({ className, externalGraph }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // NEW: whenever the parent sends a new graph, replace everything
  useEffect(() => {
    if (externalGraph) {
      setNodes(externalGraph.nodes);
      setEdges(externalGraph.edges);
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