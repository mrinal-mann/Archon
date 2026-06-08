"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

import { cn } from "@/lib/utils"
import type { CanvasNode, CanvasNodeShape } from "@/types/canvas"

type ShapeGeometryProps = {
  shape: CanvasNodeShape
  className: string
}

/**
 * Draws a single shape silhouette inside a normalized 0–100 viewBox. The parent
 * SVG stretches this to the node's size (`preserveAspectRatio="none"`), and
 * `non-scaling-stroke` keeps the outline a constant width at any node size.
 */
function ShapeGeometry({ shape, className }: ShapeGeometryProps) {
  const common = {
    className,
    vectorEffect: "non-scaling-stroke" as const,
    strokeWidth: 1.5,
  }

  switch (shape) {
    case "diamond":
      return <polygon points="50,1 99,50 50,99 1,50" {...common} />
    case "circle":
      return <ellipse cx="50" cy="50" rx="49" ry="49" {...common} />
    case "pill":
      return <rect x="1" y="1" width="98" height="98" rx="49" ry="49" {...common} />
    case "hexagon":
      return <polygon points="25,1 75,1 99,50 75,99 25,99 1,50" {...common} />
    case "cylinder":
      return (
        <>
          <path d="M1,12 V88 A49,11 0 0 0 99,88 V12" {...common} />
          <ellipse cx="50" cy="12" rx="49" ry="11" {...common} />
        </>
      )
    case "rectangle":
    default:
      return <rect x="1" y="1" width="98" height="98" rx="3" {...common} />
  }
}

/**
 * Renderer for the custom canvas node type. Each shape is drawn as its true
 * silhouette filled with the surface color and outlined with the border token,
 * with the label centered on top and top/bottom connection handles.
 */
export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div className="relative h-full w-full">
      <Handle type="target" position={Position.Top} />
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <ShapeGeometry
          shape={data.shape}
          className={cn(
            "fill-card transition-colors",
            selected ? "stroke-primary" : "stroke-border",
          )}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center">
        <span className="max-w-full truncate text-sm text-card-foreground">
          {data.label}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
