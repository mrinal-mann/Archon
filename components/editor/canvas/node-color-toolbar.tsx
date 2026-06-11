"use client"

import { useState, type PointerEvent } from "react"

import { cn } from "@/lib/utils"
import { NODE_COLOR_PALETTE, type NodeColorOption } from "@/types/canvas"

type NodeColorToolbarProps = {
  /** The node's current background color, used to mark the active swatch. */
  activeColor: string
  /** Apply a color pair to the node (background + paired text color). */
  onSelect: (option: NodeColorOption) => void
}

/**
 * Small floating toolbar shown above a selected node. It offers one swatch per
 * predefined color pair; picking a swatch updates both the node background and
 * its paired text color. Pointer events are kept from reaching React Flow so
 * interacting with the toolbar never drags the node or pans the canvas.
 */
export function NodeColorToolbar({ activeColor, onSelect }: NodeColorToolbarProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  // Stop the gesture from starting a node drag or canvas pan.
  function stopCanvasInteraction(event: PointerEvent<HTMLElement>) {
    event.stopPropagation()
  }

  return (
    <div
      className={cn(
        "nodrag nopan absolute bottom-full left-1/2 mb-3 -translate-x-1/2",
        "flex items-center gap-1.5 rounded-full border border-border bg-card",
        "p-1.5 shadow-lg",
      )}
      onPointerDown={stopCanvasInteraction}
    >
      {NODE_COLOR_PALETTE.map((option) => {
        const isActive = option.background === activeColor
        const isHovered = hovered === option.id

        return (
          <button
            key={option.id}
            type="button"
            aria-label={`Set node color to ${option.label}`}
            aria-pressed={isActive}
            title={option.label}
            onPointerDown={stopCanvasInteraction}
            onClick={() => onSelect(option)}
            onMouseEnter={() => setHovered(option.id)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "flex size-6 items-center justify-center rounded-full",
              "ring-offset-2 ring-offset-card transition-all",
              isActive ? "ring-2 ring-primary" : "ring-1 ring-border",
            )}
            style={{
              backgroundColor: option.background,
              // Tight, controlled glow tinted with the pair's text color.
              boxShadow: isHovered ? `0 0 6px 1px ${option.text}` : undefined,
            }}
          >
            {/* Inner dot in the paired text color so the swatch shows both. */}
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: option.text }}
            />
          </button>
        )
      })}
    </div>
  )
}
