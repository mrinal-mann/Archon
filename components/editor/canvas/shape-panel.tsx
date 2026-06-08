"use client"

import type { DragEvent } from "react"
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { CanvasNodeShape } from "@/types/canvas"

/** MIME type used to carry the shape payload through native drag-and-drop. */
export const SHAPE_DRAG_MIME = "application/x-canvas-shape"

/** Default on-canvas size for a dropped shape, in flow units. */
export type ShapeSize = {
  width: number
  height: number
}

/** Payload serialized into the drag event when dragging a shape onto the canvas. */
export type ShapeDragPayload = {
  shape: CanvasNodeShape
  size: ShapeSize
}

type ShapeDefinition = {
  shape: CanvasNodeShape
  label: string
  icon: LucideIcon
  size: ShapeSize
}

/**
 * The shapes offered by the panel and their default canvas sizes.
 * Rectangles/pills are wider than tall, circles are square, and diamonds are
 * slightly larger so centered labels have room.
 */
const SHAPE_DEFINITIONS: ShapeDefinition[] = [
  {
    shape: "rectangle",
    label: "Rectangle",
    icon: RectangleHorizontal,
    size: { width: 180, height: 80 },
  },
  {
    shape: "diamond",
    label: "Diamond",
    icon: Diamond,
    size: { width: 160, height: 120 },
  },
  {
    shape: "circle",
    label: "Circle",
    icon: Circle,
    size: { width: 120, height: 120 },
  },
  {
    shape: "pill",
    label: "Pill",
    icon: Pill,
    size: { width: 160, height: 64 },
  },
  {
    shape: "cylinder",
    label: "Cylinder",
    icon: Cylinder,
    size: { width: 120, height: 140 },
  },
  {
    shape: "hexagon",
    label: "Hexagon",
    icon: Hexagon,
    size: { width: 160, height: 100 },
  },
]

/**
 * Floating, pill-shaped toolbar pinned to the bottom-center of the canvas.
 * Each button is draggable; dragging carries the shape name and default size so
 * the canvas can create a matching node on drop.
 */
export function ShapePanel() {
  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    definition: ShapeDefinition,
  ) {
    const payload: ShapeDragPayload = {
      shape: definition.shape,
      size: definition.size,
    }
    event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload))
    event.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-lg">
        {SHAPE_DEFINITIONS.map((definition) => {
          const Icon = definition.icon
          return (
            <button
              key={definition.shape}
              type="button"
              draggable
              onDragStart={(event) => handleDragStart(event, definition)}
              aria-label={`Drag to add ${definition.label.toLowerCase()}`}
              title={definition.label}
              className={cn(
                "flex size-9 cursor-grab items-center justify-center rounded-full text-muted-foreground",
                "transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing",
              )}
            >
              <Icon className="size-5" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
