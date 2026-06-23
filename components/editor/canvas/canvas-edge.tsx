"use client"

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSimpleBezierPath,
  type EdgeProps,
} from "@xyflow/react"

import { useCanvasActions } from "@/components/editor/canvas/canvas-context"
import { cn } from "@/lib/utils"
import type { CanvasEdge } from "@/types/canvas"

/** Shown in the inline editor when an edge has no label yet. */
const LABEL_PLACEHOLDER = "Label"

/**
 * Custom edge renderer for the canvas. Edges use clean right-angle routing and
 * sit slightly dimmed at rest, brightening when hovered or selected. A wide,
 * transparent overlay path makes the edge easy to hover and click without
 * thickening the visible line. Double-clicking opens an inline label editor
 * positioned at the path midpoint reported by `getSmoothStepPath`.
 */
export function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeLabel } = useCanvasActions()
  const [hovered, setHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [edgePath, labelX, labelY] = getSimpleBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Focus and select the text when entering edit mode.
  useEffect(() => {
    if (isEditing) {
      const input = inputRef.current
      input?.focus()
      input?.select()
    }
  }, [isEditing])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault()
      setIsEditing(false)
    }
  }

  // Keep editor gestures from starting a node drag or canvas pan.
  function stopCanvasInteraction(event: PointerEvent<HTMLElement>) {
    event.stopPropagation()
  }

  const active = hovered || selected
  const label = data?.label ?? ""
  const hasLabel = label.trim().length > 0

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        // The transparent overlay path below owns the hit area instead.
        interactionWidth={0}
        style={{
          stroke: active ? "var(--foreground)" : "var(--muted-foreground)",
          strokeWidth: 1.5,
          strokeLinecap: "round",
          opacity: active ? 1 : 0.55,
          transition: "stroke 150ms ease, opacity 150ms ease",
        }}
      />
      {/* Wide, invisible path: a generous hover/click target that never changes
          the visible line thickness. */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={() => setIsEditing(true)}
      />
      {(hasLabel || isEditing) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            onDoubleClick={() => setIsEditing(true)}
            onPointerDown={stopCanvasInteraction}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={label}
                onChange={(event) => updateEdgeLabel(id, event.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={handleKeyDown}
                placeholder={LABEL_PLACEHOLDER}
                // Grow the input with its content (with a small minimum).
                style={{ width: `${Math.max(label.length, LABEL_PLACEHOLDER.length)}ch` }}
                className={cn(
                  "rounded-md border border-border bg-card px-2 py-0.5 text-center",
                  "text-xs leading-tight text-foreground outline-none",
                  "focus:border-primary placeholder:text-muted-foreground",
                )}
              />
            ) : (
              <span
                className={cn(
                  "cursor-text select-none rounded-md border border-border bg-card",
                  "px-2 py-0.5 text-xs leading-tight text-foreground",
                )}
              >
                {label}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
