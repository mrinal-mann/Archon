"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react"
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
  useRoom,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense"

import { CanvasNodeRenderer } from "@/components/editor/canvas/canvas-node"
import { CanvasEdgeRenderer } from "@/components/editor/canvas/canvas-edge"
import { CanvasControls } from "@/components/editor/canvas/canvas-controls"
import { CanvasActionsProvider } from "@/components/editor/canvas/canvas-context"
import { PresenceAvatars } from "@/components/editor/canvas/presence-avatars"
import { LiveCursors } from "@/components/editor/canvas/live-cursors"
import { AiPresence } from "@/components/editor/canvas/ai-presence"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import {
  useCanvasAutosave,
  type SaveStatus,
} from "@/hooks/use-canvas-autosave"
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

type CanvasInnerProps = {
  onSaveStatusChange?: (status: SaveStatus) => void
  onRegisterSave?: (save: () => void) => void
}

/**
 * The collaborative React Flow canvas. Nodes and edges are synced through
 * Liveblocks storage; shapes dragged from the bottom panel are dropped onto the
 * canvas to create new nodes.
 */
function CanvasInner({
  onSaveStatusChange,
  onRegisterSave,
}: CanvasInnerProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>()
  const { screenToFlowPosition, getNode, getEdge } = reactFlow
  const updateMyPresence = useUpdateMyPresence()
  const nodeCounter = useRef(0)

  // The Liveblocks room id is the project id, so it doubles as the save target.
  const projectId = useRoom().id

  const [templatesOpen, setTemplatesOpen] = useState(false)

  // Autosave is gated until the initial saved-canvas load has resolved.
  const [loaded, setLoaded] = useState(false)
  const loadAttempted = useRef(false)

  // On first mount, load the saved canvas only when the live room is empty.
  // A room with existing nodes/edges means active collaboration, so loading is
  // skipped entirely to avoid overwriting it.
  useEffect(() => {
    if (loadAttempted.current) {
      return
    }
    loadAttempted.current = true

    let cancelled = false
    void (async () => {
      // A room with existing content means active collaboration, so skip the
      // load entirely to avoid overwriting it — just enable autosave.
      if (nodes.length > 0 || edges.length > 0) {
        if (!cancelled) {
          setLoaded(true)
        }
        return
      }

      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`)
        if (res.ok) {
          const data = (await res.json()) as {
            nodes?: CanvasNode[]
            edges?: CanvasEdge[]
          }
          if (!cancelled) {
            if (data.nodes?.length) {
              onNodesChange(
                data.nodes.map((node) => ({ type: "add", item: node })),
              )
            }
            if (data.edges?.length) {
              onEdgesChange(
                data.edges.map((edge) => ({ type: "add", item: edge })),
              )
            }
          }
        }
      } catch {
        // A failed load leaves the canvas empty; autosave still enables below.
      } finally {
        if (!cancelled) {
          setLoaded(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
    // Runs once at mount; the ref guards against re-entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist canvas changes (debounced) once the initial load has resolved.
  const { save } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: loaded,
    onStatusChange: onSaveStatusChange,
  })

  // Expose the shared save fn so the navbar Save button can trigger it. `save`
  // is stable, so this registers once.
  useEffect(() => {
    onRegisterSave?.(() => void save())
  }, [save, onRegisterSave])

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

  const handleSelectAll = useCallback(() => {
    reactFlow.setNodes(nodes.map((n) => ({ ...n, selected: true })))
  }, [reactFlow, nodes])

  useKeyboardShortcuts({ reactFlow, onUndo: undo, onRedo: redo, onSelectAll: handleSelectAll })

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

  // Broadcast the local cursor in flow coordinates so collaborators see it at
  // the same logical canvas location regardless of their own pan/zoom.
  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const point = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      updateMyPresence({ cursor: { x: point.x, y: point.y } })
    },
    [screenToFlowPosition, updateMyPresence],
  )

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

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
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          connectionMode={ConnectionMode.Loose}
          colorMode="dark"
          fitView
          // Transparent so the canvas inherits the app background and reads as one
          // continuous surface instead of a darker boxed-in panel.
          style={{ backgroundColor: "transparent" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
        <LiveCursors />
        <AiPresence />
        <PresenceAvatars />
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

type CanvasProps = {
  onSaveStatusChange?: (status: SaveStatus) => void
  onRegisterSave?: (save: () => void) => void
}

export function Canvas({ onSaveStatusChange, onRegisterSave }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner
        onSaveStatusChange={onSaveStatusChange}
        onRegisterSave={onRegisterSave}
      />
    </ReactFlowProvider>
  )
}
