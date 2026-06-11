"use client"

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react"
import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from "@xyflow/react"

import { useCanvasActions } from "@/components/editor/canvas/canvas-context"
import { NodeColorToolbar } from "@/components/editor/canvas/node-color-toolbar"
import { cn } from "@/lib/utils"
import {
  DEFAULT_NODE_TEXT_COLOR,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas"

/** Smallest a node may be resized to, keeping the label area usable. */
const MIN_NODE_WIDTH = 80
const MIN_NODE_HEIGHT = 48

/** Shown in the centered label position when a node has no label yet. */
const LABEL_PLACEHOLDER = "Add label"

/**
 * Connection handles, one per side. With the canvas in loose connection mode,
 * a connection can start and end on any handle, so a single handle per side is
 * enough for any-to-any wiring.
 */
const HANDLE_POSITIONS = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const

/**
 * Subtle white dots with a dark border. Hidden by default, they fade in when
 * the node (the parent `group`) is hovered.
 */
const HANDLE_CLASS_NAME = cn(
  "!h-2.5 !w-2.5 !min-h-0 !min-w-0 !rounded-full !border !border-background !bg-white",
  "!opacity-0 !transition-opacity !duration-150 group-hover:!opacity-100",
)

type ShapeGeometryProps = {
  shape: CanvasNodeShape
  className: string
  /** Background fill color applied to the silhouette. */
  fill: string
}

/**
 * Draws a single shape silhouette inside a normalized 0–100 viewBox. The parent
 * SVG stretches this to the node's size (`preserveAspectRatio="none"`), and
 * `non-scaling-stroke` keeps the outline a constant width at any node size.
 */
function ShapeGeometry({ shape, className, fill }: ShapeGeometryProps) {
  const common = {
    className,
    style: { fill },
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
 * silhouette filled with the surface color and outlined with the border token.
 * Selected nodes expose subtle resize handles; double-clicking the label area
 * opens an inline editor whose updates flow through collaborative storage.
 */
export function CanvasNodeRenderer({ id, data, selected }: NodeProps<CanvasNode>) {
  const { updateNodeLabel, updateNodeColor } = useCanvasActions()
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus and select the text when entering edit mode.
  useEffect(() => {
    if (isEditing) {
      const textarea = textareaRef.current
      textarea?.focus()
      textarea?.select()
    }
  }, [isEditing])

  function handleStartEditing() {
    setIsEditing(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      setIsEditing(false)
    }
  }

  // Keep text-selection gestures inside the editor from starting a node drag or
  // canvas pan.
  function stopCanvasInteraction(event: PointerEvent<HTMLTextAreaElement>) {
    event.stopPropagation()
  }

  const hasLabel = data.label.trim().length > 0
  const textColor = data.textColor ?? DEFAULT_NODE_TEXT_COLOR

  return (
    <div className="group relative h-full w-full">
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        lineClassName="!border-primary/40"
        handleClassName="!size-1.5 !rounded-[2px] !border-0 !bg-primary/70"
      />
      {selected ? (
        <NodeColorToolbar
          activeColor={data.color}
          onSelect={(option) =>
            updateNodeColor(id, option.background, option.text)
          }
        />
      ) : null}
      {HANDLE_POSITIONS.map(({ id: handleId, position }) => (
        <Handle
          key={handleId}
          id={handleId}
          type="source"
          position={position}
          className={HANDLE_CLASS_NAME}
        />
      ))}
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <ShapeGeometry
          shape={data.shape}
          fill={data.color}
          className={cn(
            "transition-colors",
            selected ? "stroke-primary" : "stroke-border",
          )}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center px-3 text-center"
        onDoubleClick={handleStartEditing}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={data.label}
            onChange={(event) => updateNodeLabel(id, event.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            onPointerDown={stopCanvasInteraction}
            placeholder={LABEL_PLACEHOLDER}
            rows={1}
            style={{ color: textColor }}
            className={cn(
              "nodrag nopan w-full resize-none border-0 bg-transparent p-0 text-center",
              "text-sm leading-tight outline-none",
              "placeholder:text-muted-foreground",
            )}
          />
        ) : (
          <span
            style={hasLabel ? { color: textColor } : undefined}
            className={cn(
              "pointer-events-none max-w-full truncate text-sm leading-tight",
              hasLabel ? undefined : "text-muted-foreground",
            )}
          >
            {hasLabel ? data.label : LABEL_PLACEHOLDER}
          </span>
        )}
      </div>
    </div>
  )
}
