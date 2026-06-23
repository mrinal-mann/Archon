"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

/** Lifecycle of a save write, surfaced to the editor save button. */
export type SaveStatus = "idle" | "saving" | "saved" | "error"

/** Wait this long after the last change before writing, to batch rapid edits. */
const AUTOSAVE_DEBOUNCE_MS = 1500

/** How long a terminal status (saved/error) lingers before returning to idle. */
const STATUS_RESET_MS = 2000

type UseCanvasAutosaveOptions = {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /**
   * Autosave stays paused until the initial saved-canvas load has resolved, so
   * loading never races with (or is overwritten by) an early save.
   */
  enabled: boolean;
  /** Reports save status to the parent so it can render an indicator/button. */
  onStatusChange?: (status: SaveStatus) => void;
};

type UseCanvasAutosaveResult = {
  status: SaveStatus;
  /** Saves the current canvas immediately. Shared by autosave and the button. */
  save: () => Promise<void>;
};

/**
 * Watches the collaborative canvas nodes/edges and debounces a save to the
 * canvas API route whenever they change. Also exposes a stable `save()` so a
 * Save button can trigger the exact same write manually. Tracks the save
 * lifecycle (saving → saved/error → idle) and reports it upward.
 */
export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
  onStatusChange,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveResult {
  const [status, setStatus] = useState<SaveStatus>("idle")

  // Keep the latest data/id in a ref so `save` can stay stable (identity never
  // changes), which lets it be registered once with the parent.
  const dataRef = useRef({ projectId, nodes, edges })
  useEffect(() => {
    dataRef.current = { projectId, nodes, edges }
  }, [projectId, nodes, edges])

  // Guards against overlapping writes (manual click during an autosave, etc.).
  const savingRef = useRef(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onStatusChange?.(status)
  }, [status, onStatusChange])

  const save = useCallback(async () => {
    if (savingRef.current) {
      return
    }
    savingRef.current = true
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
    }
    setStatus("saving")

    const { projectId, nodes, edges } = dataRef.current
    try {
      const res = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      })
      setStatus(res.ok ? "saved" : "error")
    } catch {
      setStatus("error")
    } finally {
      savingRef.current = false
      // Show the terminal state briefly, then return to idle ("Save").
      resetTimerRef.current = setTimeout(
        () => setStatus("idle"),
        STATUS_RESET_MS,
      )
    }
  }, [])

  // The state present when autosave first becomes enabled is already persisted
  // (just loaded or the existing room state), so skip it and only react to
  // genuine edits afterwards.
  const skipNextRef = useRef(true)

  useEffect(() => {
    if (!enabled) {
      return
    }
    if (skipNextRef.current) {
      skipNextRef.current = false
      return
    }

    const timer = setTimeout(() => void save(), AUTOSAVE_DEBOUNCE_MS)
    // Reset the debounce timer on every further change before it fires.
    return () => clearTimeout(timer)
  }, [nodes, edges, enabled, save])

  // Clear any pending reset timer on unmount.
  useEffect(
    () => () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
    },
    [],
  )

  return { status, save }
}
