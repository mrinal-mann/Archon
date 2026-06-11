"use client"

import { createContext, useContext } from "react"

/**
 * Canvas-level actions that must route through the Liveblocks-backed
 * `onNodesChange` / `onEdgesChange` flows so updates stay in sync across
 * collaborators. The custom node and edge renderers cannot reach those handlers
 * directly, so the canvas provides these callbacks through context.
 */
export type CanvasActions = {
  /** Update a node's label, syncing the change through collaborative storage. */
  updateNodeLabel: (id: string, label: string) => void
  /**
   * Update a node's background and paired text color, syncing the change
   * through collaborative storage.
   */
  updateNodeColor: (id: string, color: string, textColor: string) => void
  /** Update an edge's inline label, syncing the change through collaborative storage. */
  updateEdgeLabel: (id: string, label: string) => void
}

const CanvasActionsContext = createContext<CanvasActions | null>(null)

export const CanvasActionsProvider = CanvasActionsContext.Provider

export function useCanvasActions(): CanvasActions {
  const actions = useContext(CanvasActionsContext)
  if (!actions) {
    throw new Error("useCanvasActions must be used within a CanvasActionsProvider")
  }
  return actions
}
