import type { Edge, Node } from "@xyflow/react"

/**
 * Visual shape options for a canvas node. Kept open-ended for now; richer
 * shape-specific rendering arrives with custom node rendering later.
 */
export type CanvasNodeShape = "rectangle" | "rounded" | "ellipse" | "diamond"

/**
 * Data carried by every canvas node. Shared across the collaborative canvas,
 * the future custom node renderer, and AI-driven node creation.
 */
export type CanvasNodeData = {
  label: string
  color: string
  shape: CanvasNodeShape
}

/** Data carried by every canvas edge. Empty for now; reserved for future use. */
export type CanvasEdgeData = Record<string, never>

/** Custom node type registered with React Flow. */
export const CANVAS_NODE_TYPE = "canvasNode" as const

/** Custom edge type registered with React Flow. */
export const CANVAS_EDGE_TYPE = "canvasEdge" as const

/** A React Flow node backed by Liveblocks storage. */
export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>

/** A React Flow edge backed by Liveblocks storage. */
export type CanvasEdge = Edge<CanvasEdgeData, typeof CANVAS_EDGE_TYPE>
