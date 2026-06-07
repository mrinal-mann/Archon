"use client"

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-flow/styles.css"

/**
 * The collaborative React Flow canvas. Nodes and edges are synced through
 * Liveblocks storage; this component renders the shared diagram and basic
 * canvas affordances only.
 */
export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  return (
    <ReactFlow<CanvasNode, CanvasEdge>
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      connectionMode={ConnectionMode.Loose}
      colorMode="dark"
      fitView
    >
      <Background variant={BackgroundVariant.Dots} />
    </ReactFlow>
  )
}
