import type { Edge, Node } from "@xyflow/react"

/**
 * Visual shape options for a canvas node. These are the shapes offered by the
 * bottom shape panel; richer shape-specific rendering arrives later.
 */
export type CanvasNodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon"

/**
 * Data carried by every canvas node. Shared across the collaborative canvas,
 * the custom node renderer, and AI-driven node creation.
 */
export type CanvasNodeData = {
  label: string
  color: string
  shape: CanvasNodeShape
}

/** Default fill color applied to newly created nodes. */
export const DEFAULT_NODE_COLOR = "#27272a" as const

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
