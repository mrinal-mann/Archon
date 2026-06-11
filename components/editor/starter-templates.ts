import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLOR_PALETTE,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
  type NodeColorOption,
} from "@/types/canvas"

/**
 * A pre-built diagram users can import as a starting point instead of building
 * a canvas from scratch. Carries fully-formed canvas nodes and edges so an
 * import is a direct drop into collaborative storage.
 */
export type CanvasTemplate = {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/** Default on-canvas size per shape, mirroring the shape panel defaults. */
const SHAPE_SIZE: Record<CanvasNodeShape, { width: number; height: number }> = {
  rectangle: { width: 180, height: 80 },
  diamond: { width: 160, height: 120 },
  circle: { width: 120, height: 120 },
  pill: { width: 160, height: 64 },
  cylinder: { width: 120, height: 140 },
  hexagon: { width: 160, height: 100 },
}

/** Look up a color pair by its palette id, falling back to the first pair. */
function color(id: NodeColorOption["id"]): NodeColorOption {
  return NODE_COLOR_PALETTE.find((option) => option.id === id) ?? NODE_COLOR_PALETTE[0]
}

/**
 * Build a fully-formed canvas node. The color id maps to a palette pair so the
 * template data stays readable; the size defaults to the shape's standard size.
 */
function node(
  id: string,
  label: string,
  shape: CanvasNodeShape,
  x: number,
  y: number,
  colorId: NodeColorOption["id"],
): CanvasNode {
  const pair = color(colorId)
  const size = SHAPE_SIZE[shape]
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position: { x, y },
    data: {
      label,
      color: pair.background,
      textColor: pair.text,
      shape,
    },
    style: { width: size.width, height: size.height },
  }
}

/** Build a canvas edge between two node ids, with an optional inline label. */
function edge(
  id: string,
  source: string,
  target: string,
  label?: string,
): CanvasEdge {
  return {
    id,
    type: CANVAS_EDGE_TYPE,
    source,
    target,
    data: label ? { label } : undefined,
  }
}

/** Microservices: a gateway fanning out to services backed by shared infra. */
const MICROSERVICES: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "An API gateway routing to independent services, backed by a shared database and message queue.",
  nodes: [
    node("client", "Client", "rectangle", 200, 0, "slate"),
    node("gateway", "API Gateway", "rectangle", 200, 140, "blue"),
    node("auth", "Auth Service", "rectangle", -40, 300, "violet"),
    node("orders", "Orders Service", "rectangle", 200, 300, "violet"),
    node("payments", "Payments Service", "rectangle", 440, 300, "violet"),
    node("queue", "Message Queue", "pill", 440, 460, "amber"),
    node("database", "Database", "cylinder", 200, 480, "green"),
  ],
  edges: [
    edge("client-gateway", "client", "gateway"),
    edge("gateway-auth", "gateway", "auth"),
    edge("gateway-orders", "gateway", "orders"),
    edge("gateway-payments", "gateway", "payments"),
    edge("orders-db", "orders", "database"),
    edge("auth-db", "auth", "database"),
    edge("payments-queue", "payments", "queue"),
  ],
}

/** CI/CD pipeline: a linear flow from commit through to production. */
const CICD_PIPELINE: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "A linear delivery pipeline from source commit through build, test, and deploy to production.",
  nodes: [
    node("commit", "Commit", "pill", 0, 120, "slate"),
    node("build", "Build", "rectangle", 220, 110, "blue"),
    node("test", "Test", "diamond", 460, 90, "amber"),
    node("deploy", "Deploy", "rectangle", 680, 110, "violet"),
    node("production", "Production", "cylinder", 920, 80, "green"),
  ],
  edges: [
    edge("commit-build", "commit", "build", "push"),
    edge("build-test", "build", "test"),
    edge("test-deploy", "test", "deploy", "pass"),
    edge("deploy-production", "deploy", "production"),
  ],
}

/** Event-driven system: a producer broadcasting through a bus to consumers. */
const EVENT_DRIVEN: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "A producer publishing to an event bus that fans events out to independent consumers.",
  nodes: [
    node("producer", "Producer", "rectangle", 0, 200, "blue"),
    node("bus", "Event Bus", "hexagon", 280, 190, "amber"),
    node("consumer-a", "Email Consumer", "rectangle", 560, 60, "violet"),
    node("consumer-b", "Analytics Consumer", "rectangle", 560, 200, "violet"),
    node("consumer-c", "Audit Consumer", "rectangle", 560, 340, "violet"),
    node("store", "Event Store", "cylinder", 280, 380, "green"),
  ],
  edges: [
    edge("producer-bus", "producer", "bus", "publish"),
    edge("bus-a", "bus", "consumer-a"),
    edge("bus-b", "bus", "consumer-b"),
    edge("bus-c", "bus", "consumer-c"),
    edge("bus-store", "bus", "store"),
  ],
}

/** The starter templates offered by the template library. */
export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  MICROSERVICES,
  CICD_PIPELINE,
  EVENT_DRIVEN,
]
