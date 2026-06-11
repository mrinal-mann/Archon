"use client"

import { useCallback, useRef, useState, type DragEvent } from "react"
import { LayoutTemplate } from "lucide-react"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type DefaultEdgeOptions,
  type EdgeChange,
  type EdgeTypes,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense"

import { CanvasNodeRenderer } from "@/components/editor/canvas/canvas-node"
import { CanvasEdgeRenderer } from "@/components/editor/canvas/canvas-edge"
import { CanvasControls } from "@/components/editor/canvas/canvas-controls"
import { CanvasActionsProvider } from "@/components/editor/canvas/canvas-context"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import {
  ShapePanel,
  SHAPE_DRAG_MIME,
  type ShapeDragPayload,
} from "@/components/editor/canvas/shape-panel"
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-flow/styles.css"

/** Short animation (ms) so zoom and fit-view movements feel smooth. */
const ZOOM_ANIMATION_DURATION = 200

const nodeTypes: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
}

const edgeTypes: EdgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer,
}

/**
 * New connections render with the custom canvas edge: a light stroke with
 * rounded ends and an arrowhead at the target end.
 */
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: CANVAS_EDGE_TYPE,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: "var(--muted-foreground)",
  },
}

/**
 * The collaborative React Flow canvas. Nodes and edges are synced through
 * Liveblocks storage; shapes dragged from the bottom panel are dropped onto the
 * canvas to create new nodes.
 */
function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>()
  const { screenToFlowPosition, getNode, getEdge } = reactFlow
  const nodeCounter = useRef(0)

  const [templatesOpen, setTemplatesOpen] = useState(false)

  // Undo/redo run against the Liveblocks room history, which the
  // useLiveblocksFlow changes already route through.
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  const handleZoomIn = useCallback(
    () => reactFlow.zoomIn({ duration: ZOOM_ANIMATION_DURATION }),
    [reactFlow],
  )
  const handleZoomOut = useCallback(
    () => reactFlow.zoomOut({ duration: ZOOM_ANIMATION_DURATION }),
    [reactFlow],
  )
  const handleFitView = useCallback(
    () => reactFlow.fitView({ duration: ZOOM_ANIMATION_DURATION }),
    [reactFlow],
  )

  useKeyboardShortcuts({ reactFlow, onUndo: undo, onRedo: redo })

  const updateNodeLabel = useCallback(
    (id: string, label: string) => {
      const node = getNode(id)
      if (!node) {
        return
      }
      // Route the label update through the existing collaborative node-change
      // flow so it syncs through Liveblocks storage.
      onNodesChange([
        {
          type: "replace",
          id,
          item: { ...node, data: { ...node.data, label } },
        },
      ])
    },
    [getNode, onNodesChange],
  )

  const updateNodeColor = useCallback(
    (id: string, color: string, textColor: string) => {
      const node = getNode(id)
      if (!node) {
        return
      }
      // Apply the background/text pair through the same collaborative flow so the
      // color change syncs across collaborators with no server call.
      onNodesChange([
        {
          type: "replace",
          id,
          item: { ...node, data: { ...node.data, color, textColor } },
        },
      ])
    },
    [getNode, onNodesChange],
  )

  const updateEdgeLabel = useCallback(
    (id: string, label: string) => {
      const edge = getEdge(id)
      if (!edge) {
        return
      }
      // Route the label update through the collaborative edge-change flow so it
      // syncs through Liveblocks storage.
      onEdgesChange([
        {
          type: "replace",
          id,
          item: { ...edge, data: { ...edge.data, label } },
        },
      ])
    },
    [getEdge, onEdgesChange],
  )

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      // Namespace the template's ids so repeated imports never collide with
      // existing nodes/edges, and remap edge endpoints to the new node ids.
      nodeCounter.current += 1
      const prefix = `tpl-${Date.now()}-${nodeCounter.current}`
      const idMap = new Map<string, string>()

      const nodeChanges: NodeChange<CanvasNode>[] = template.nodes.map(
        (node) => {
          const newId = `${prefix}-${node.id}`
          idMap.set(node.id, newId)
          return { type: "add", item: { ...node, id: newId, selected: false } }
        },
      )
      onNodesChange(nodeChanges)

      const edgeChanges: EdgeChange<CanvasEdge>[] = template.edges.map(
        (edge) => ({
          type: "add",
          item: {
            ...edge,
            id: `${prefix}-${edge.id}`,
            source: idMap.get(edge.source) ?? edge.source,
            target: idMap.get(edge.target) ?? edge.target,
          },
        }),
      )
      onEdgesChange(edgeChanges)

      // Frame the freshly imported diagram once it has mounted.
      window.requestAnimationFrame(() =>
        reactFlow.fitView({ duration: ZOOM_ANIMATION_DURATION }),
      )
    },
    [onNodesChange, onEdgesChange, reactFlow],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME)) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const raw = event.dataTransfer.getData(SHAPE_DRAG_MIME)
      if (!raw) {
        return
      }
      event.preventDefault()

      const payload = JSON.parse(raw) as ShapeDragPayload
      // Convert the drop point to flow coordinates (accounts for pan + zoom),
      // then offset by half the shape so it is centered under the cursor.
      const point = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      const position = {
        x: point.x - payload.size.width / 2,
        y: point.y - payload.size.height / 2,
      }

      nodeCounter.current += 1
      const id = `${payload.shape}-${Date.now()}-${nodeCounter.current}`

      const newNode: CanvasNode = {
        id,
        type: CANVAS_NODE_TYPE,
        position,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          textColor: DEFAULT_NODE_TEXT_COLOR,
          shape: payload.shape,
        },
        style: {
          width: payload.size.width,
          height: payload.size.height,
        },
      }

      onNodesChange([{ type: "add", item: newNode }])
    },
    [onNodesChange, screenToFlowPosition],
  )

  return (
    <CanvasActionsProvider
      value={{ updateNodeLabel, updateNodeColor, updateEdgeLabel }}
    >
      <div
        className="relative h-full w-full"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ReactFlow<CanvasNode, CanvasEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          connectionMode={ConnectionMode.Loose}
          colorMode="dark"
          fitView
          // Transparent so the canvas inherits the app background and reads as one
          // continuous surface instead of a darker boxed-in panel.
          style={{ backgroundColor: "transparent" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
        <div className="pointer-events-none absolute top-6 left-6 z-10 flex">
          <button
            type="button"
            onClick={() => setTemplatesOpen(true)}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-lg transition-colors hover:bg-accent"
          >
            <LayoutTemplate className="size-4" />
            Templates
          </button>
        </div>
        <CanvasControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <ShapePanel />
      </div>
      <StarterTemplatesModal
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onImport={handleImportTemplate}
      />
    </CanvasActionsProvider>
  )
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
