"use client"

import { useCallback, useRef, type DragEvent } from "react"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"

import { CanvasNodeRenderer } from "@/components/editor/canvas/canvas-node"
import {
  ShapePanel,
  SHAPE_DRAG_MIME,
  type ShapeDragPayload,
} from "@/components/editor/canvas/shape-panel"
import {
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-flow/styles.css"

const nodeTypes: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
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

  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>()
  const nodeCounter = useRef(0)

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
    <div
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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
      <ShapePanel />
    </div>
  )
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
