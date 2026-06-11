"use client"

import { Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react"

import { cn } from "@/lib/utils"

type CanvasControlsProps = {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onUndo: () => void
  onRedo: () => void
  /** Whether there is history to undo; disables and dims the undo button. */
  canUndo: boolean
  /** Whether there is history to redo; disables and dims the redo button. */
  canRedo: boolean
}

const BUTTON_CLASS = cn(
  "flex size-9 items-center justify-center rounded-full text-muted-foreground",
  "transition-colors hover:bg-accent hover:text-foreground",
  "disabled:pointer-events-none disabled:opacity-40",
)

/**
 * Floating, pill-shaped control bar pinned to the bottom-left of the canvas,
 * above the bottom-center shape panel. It groups zoom controls (out, fit, in)
 * and history controls (undo, redo), separated by a thin divider.
 */
export function CanvasControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasControlsProps) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-10 flex">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-lg">
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
          className={BUTTON_CLASS}
        >
          <ZoomOut className="size-5" />
        </button>
        <button
          type="button"
          onClick={onFitView}
          aria-label="Fit view"
          title="Fit view"
          className={BUTTON_CLASS}
        >
          <Maximize className="size-5" />
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
          className={BUTTON_CLASS}
        >
          <ZoomIn className="size-5" />
        </button>
        <span className="mx-1 h-6 w-px bg-border" aria-hidden />
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo"
          className={BUTTON_CLASS}
        >
          <Undo2 className="size-5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo"
          className={BUTTON_CLASS}
        >
          <Redo2 className="size-5" />
        </button>
      </div>
    </div>
  )
}
