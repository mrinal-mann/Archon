"use client"

import { Fragment } from "react"

import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type CanvasNode } from "@/types/canvas"

/** Fixed-size viewport (px) every template preview is fit into. */
const PREVIEW_WIDTH = 280
const PREVIEW_HEIGHT = 150
/** Inner padding (px) so shapes never touch the preview edges. */
const PREVIEW_PADDING = 14

type StarterTemplatesModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the chosen template; the modal closes itself afterwards. */
  onImport: (template: CanvasTemplate) => void
  /** Templates to offer; defaults to the built-in library. */
  templates?: CanvasTemplate[]
}

/** Read a node's on-canvas size from its inline style (set by the template). */
function nodeSize(node: CanvasNode): { width: number; height: number } {
  return {
    width: Number(node.style?.width) || 0,
    height: Number(node.style?.height) || 0,
  }
}

type ShapeProps = {
  node: CanvasNode
  width: number
  height: number
}

/**
 * A single shape silhouette drawn at the node's absolute position/size. The
 * outer <g> is scaled to fit the preview, so strokes use `non-scaling-stroke`
 * to stay crisp.
 */
function PreviewShape({ node, width, height }: ShapeProps) {
  const { x, y } = node.position
  const fill = node.data.color
  const common = {
    fill,
    stroke: "var(--border)",
    strokeWidth: 1,
    vectorEffect: "non-scaling-stroke" as const,
  }

  switch (node.data.shape) {
    case "diamond":
      return (
        <polygon
          points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${
            x + width / 2
          },${y + height} ${x},${y + height / 2}`}
          {...common}
        />
      )
    case "circle":
      return (
        <ellipse
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
          {...common}
        />
      )
    case "pill":
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={height / 2}
          ry={height / 2}
          {...common}
        />
      )
    case "hexagon": {
      const inset = width * 0.22
      return (
        <polygon
          points={`${x + inset},${y} ${x + width - inset},${y} ${x + width},${
            y + height / 2
          } ${x + width - inset},${y + height} ${x + inset},${y + height} ${x},${
            y + height / 2
          }`}
          {...common}
        />
      )
    }
    case "cylinder": {
      const ry = height * 0.12
      return (
        <Fragment>
          <path
            d={`M${x},${y + ry} V${y + height - ry} A${width / 2},${ry} 0 0 0 ${
              x + width
            },${y + height - ry} V${y + ry}`}
            {...common}
          />
          <ellipse cx={x + width / 2} cy={y + ry} rx={width / 2} ry={ry} {...common} />
        </Fragment>
      )
    }
    case "rectangle":
    default:
      return (
        <rect x={x} y={y} width={width} height={height} rx={4} {...common} />
      )
  }
}

/**
 * A lightweight diagram preview for a template. It computes the bounds of the
 * template's nodes, fits them into a fixed viewport, draws edges as straight
 * lines between node centers, and draws each node using its shape and color.
 * No React Flow instance is involved.
 */
function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const sized = template.nodes.map((node) => ({ node, ...nodeSize(node) }))

  // Bounds across every node (top-left to bottom-right).
  const minX = Math.min(...sized.map((n) => n.node.position.x))
  const minY = Math.min(...sized.map((n) => n.node.position.y))
  const maxX = Math.max(...sized.map((n) => n.node.position.x + n.width))
  const maxY = Math.max(...sized.map((n) => n.node.position.y + n.height))

  const contentWidth = Math.max(maxX - minX, 1)
  const contentHeight = Math.max(maxY - minY, 1)

  // Fit the content inside the padded viewport, preserving aspect ratio.
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / contentWidth,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / contentHeight,
  )

  // Center the scaled content within the viewport.
  const offsetX =
    (PREVIEW_WIDTH - contentWidth * scale) / 2 - minX * scale
  const offsetY =
    (PREVIEW_HEIGHT - contentHeight * scale) / 2 - minY * scale

  // Map each node id to its center so edges can connect them.
  const centers = new Map(
    sized.map(({ node, width, height }) => [
      node.id,
      { x: node.position.x + width / 2, y: node.position.y + height / 2 },
    ]),
  )

  return (
    <svg
      width={PREVIEW_WIDTH}
      height={PREVIEW_HEIGHT}
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      className="h-auto w-full rounded-lg bg-muted/40"
      role="img"
      aria-label={`${template.name} diagram preview`}
    >
      <g transform={`translate(${offsetX} ${offsetY}) scale(${scale})`}>
        {template.edges.map((edge) => {
          const from = centers.get(edge.source)
          const to = centers.get(edge.target)
          if (!from || !to) {
            return null
          }
          return (
            <line
              key={edge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
        {sized.map(({ node, width, height }) => (
          <PreviewShape
            key={node.id}
            node={node}
            width={width}
            height={height}
          />
        ))}
      </g>
    </svg>
  )
}

/** A single template card: preview, name, description, and an import action. */
function TemplateCard({
  template,
  onImport,
}: {
  template: CanvasTemplate
  onImport: (template: CanvasTemplate) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      <TemplatePreview template={template} />
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-heading text-sm font-medium text-foreground">
          {template.name}
        </h3>
        <p className="text-xs leading-snug text-muted-foreground">
          {template.description}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        className="w-full"
        onClick={() => onImport(template)}
      >
        Import
      </Button>
    </div>
  )
}

/**
 * A dialog presenting the starter template library as a scrollable grid of
 * cards. Each card previews the diagram and offers an import action that calls
 * `onImport` with the selected template and then closes the modal.
 */
export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
  templates = CANVAS_TEMPLATES,
}: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start from a template</DialogTitle>
          <DialogDescription>
            Pick a pre-built diagram to start your canvas instead of building
            from scratch.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-1 max-h-[60vh] px-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onImport={handleImport}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
