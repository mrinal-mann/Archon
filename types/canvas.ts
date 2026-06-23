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
  /** Node background (fill) color. */
  color: string
  /** Paired label/text color for the chosen background. */
  textColor?: string
  shape: CanvasNodeShape
}

/**
 * A predefined node color theme: a background fill paired with a matching text
 * color. Selecting a swatch applies both at once. These live here (rather than
 * in `globals.css`) because they are canvas-node specific, not part of the
 * shared semantic theme tokens.
 */
export type NodeColorOption = {
  id: string
  label: string
  background: string
  text: string
}

/**
 * The predefined background/text color pairs offered by the node color toolbar.
 * Backgrounds are deep, dark-canvas-friendly tints; each text color is tuned to
 * read clearly on its paired background.
 */
export const NODE_COLOR_PALETTE: readonly NodeColorOption[] = [
  { id: "slate", label: "Slate", background: "#27272a", text: "#e4e4e7" },
  { id: "blue", label: "Blue", background: "#1e3a8a", text: "#bfdbfe" },
  { id: "green", label: "Green", background: "#14532d", text: "#bbf7d0" },
  { id: "amber", label: "Amber", background: "#78350f", text: "#fde68a" },
  { id: "rose", label: "Rose", background: "#881337", text: "#fecdd3" },
  { id: "violet", label: "Violet", background: "#4c1d95", text: "#ddd6fe" },
] as const

/** Default fill color applied to newly created nodes (matches the first pair). */
export const DEFAULT_NODE_COLOR = NODE_COLOR_PALETTE[0].background

/** Default label color applied to newly created nodes (matches the first pair). */
export const DEFAULT_NODE_TEXT_COLOR = NODE_COLOR_PALETTE[0].text

/** Data carried by every canvas edge. */
export type CanvasEdgeData = {
  /** Optional inline label rendered at the edge midpoint. */
  label?: string
}

/** Custom node type registered with React Flow. */
export const CANVAS_NODE_TYPE = "canvasNode" as const

/** Custom edge type registered with React Flow. */
export const CANVAS_EDGE_TYPE = "canvasEdge" as const

/** A React Flow node backed by Liveblocks storage. */
export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>

/** A React Flow edge backed by Liveblocks storage. */
export type CanvasEdge = Edge<CanvasEdgeData, typeof CANVAS_EDGE_TYPE>

/** Lifecycle phase of the AI design agent, surfaced to every participant. */
export type AiAgentStatus =
  | "idle"
  | "thinking"
  | "generating"
  | "applying"
  | "complete"
  | "error"

/**
 * Shared AI agent presence + status, published into Liveblocks storage by the
 * design-agent background task so every participant sees the same live progress.
 * Stored as a plain (immutable) value rather than a Live structure because the
 * task rewrites it wholesale at each step.
 *
 * `thinking` and `cursor` are the AI's *presence* (mirroring the human presence
 * fields); `status` and `message` are the shared *status feed*. When a run
 * finishes the presence is cleared (`thinking: false`, `cursor: null`) while the
 * final status message stays visible briefly.
 */
export type AiPresence = {
  status: AiAgentStatus
  /** Human-readable status feed message for the current step. */
  message: string
  /** Whether the AI is actively working (drives the thinking indicator). */
  thinking: boolean
  /** AI cursor position in flow coordinates, null when not present. */
  cursor: { x: number; y: number } | null
  /** Epoch ms of the last update, so stale states can be ignored/expired. */
  updatedAt: number
}
