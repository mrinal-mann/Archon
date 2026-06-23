import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { logger, task } from "@trigger.dev/sdk";
import { mutateFlow, type MutableFlow } from "@liveblocks/react-flow/node";
import { generateObject } from "ai";
import { z } from "zod";

import { liveblocks } from "@/lib/liveblocks";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLOR_PALETTE,
  type AiAgentStatus,
  type AiPresence,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas";

/**
 * Allowed node shapes — kept in sync with the bottom shape panel. The model may
 * only choose from these so generated nodes render with the existing renderer.
 */
const SHAPE_VALUES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const satisfies readonly CanvasNodeShape[];

/** Allowed palette color ids — generated nodes must use one of these. */
const COLOR_IDS = NODE_COLOR_PALETTE.map((c) => c.id) as [string, ...string[]];

/**
 * Default on-canvas size per shape, mirroring the shape panel so AI-created
 * nodes match hand-placed ones. Used when the model does not specify a size.
 */
const SHAPE_SIZE: Record<CanvasNodeShape, { width: number; height: number }> = {
  rectangle: { width: 180, height: 80 },
  diamond: { width: 160, height: 120 },
  circle: { width: 120, height: 120 },
  pill: { width: 160, height: 64 },
  cylinder: { width: 120, height: 140 },
  hexagon: { width: 160, height: 100 },
};

/** How long the ghost cursor travels to a spot before the change lands (ms). */
const CURSOR_TRAVEL_MS = 320;

/** Pause after each applied action so the build reads as a steady sequence (ms). */
const STEP_SETTLE_MS = 160;

/** Small async delay used to pace the animated canvas build. */
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Arrowhead applied to AI-created edges so they match UI-drawn connections. */
const ARROW_MARKER = {
  type: "arrowclosed",
  width: 16,
  height: 16,
  color: "var(--muted-foreground)",
} as unknown as CanvasEdge["markerEnd"];

const SYSTEM_PROMPT = `You are Ghost AI, a senior systems architect who designs clear architecture diagrams on a collaborative canvas.

You receive the user's request and the current canvas (nodes + edges as JSON). Respond with an ordered list of canvas ACTIONS that realize the request.

ACTIONS (the "type" field selects which):
- add_node: create a node. Requires id, label, shape, color, x, y (width/height optional).
- move_node: reposition an existing node (id, x, y).
- resize_node: resize an existing node (id, width, height).
- update_node_data: change an existing node's label/shape/color (id + any of label/shape/color).
- delete_node: remove an existing node (id); its edges are removed automatically.
- add_edge: connect two nodes (id, source, target, optional label).
- delete_edge: remove an existing edge (id).

DESIGN GOAL:
- Produce a COMPLETE but readable architecture — aim for roughly 9 to 15 nodes. Include the important pieces (external clients, load balancer / ingress, API gateway, the core back-end services, a cache, a message queue and/or worker, the primary database, and one or two supporting infra components such as monitoring or analytics). Do NOT over-detail with minor sub-components — favor a clean, well-spaced diagram over an exhaustive one.

SHAPES (use them semantically):
- rectangle = service / application component
- cylinder = database / persistent storage
- hexagon = message queue / event bus
- diamond = gateway / load balancer / router
- circle = external client / user / third-party
- pill = API / endpoint / cache

COLORS — you MUST use several different palette colors so the diagram reads clearly; give each logical layer its OWN color (related nodes share a color, never make everything one color). Allowed ids: ${COLOR_IDS.join(", ")}. Suggested mapping:
- clients / external → slate
- gateway / load balancer → violet
- core services → blue
- cache / queue / workers → amber
- databases / storage → green
- monitoring / analytics / infra → rose

LAYOUT — arrange nodes in clear horizontal layers from top to bottom, following the request flow. Spread nodes across x within each layer and keep node CENTERS at least 320px apart horizontally. Use these approximate y bands:
- Clients: y ≈ 0
- Load balancer / ingress: y ≈ 200
- API gateway: y ≈ 400
- Core services: y ≈ 600
- Cache / queue / workers: y ≈ 820
- Databases / storage: y ≈ 1040
- Put side infrastructure (monitoring, analytics, key services) in a column to the right at x ≈ 1300+.
Use integer x/y, never overlap nodes, and center each layer so the diagram looks balanced.

LABELS: short, 1-4 words. IDS: invent short unique ids for NEW nodes (e.g. "gateway", "url-service", "cache", "db"). For edits/edges reference EXISTING ids from the provided canvas.

EDGE LABELS: Every add_edge action MUST include a label that describes what flows between the two nodes — the request type, data operation, or relationship (e.g. "HTTP Request", "Browse Products", "Cache Miss", "Place Order", "Write/Update", "Publish Event", "Query", "Read Cache"). Keep edge labels to 1-4 words. Never leave an edge unlabeled.

When the canvas is empty, design the full system from scratch. When it already has content, make the SMALLEST set of changes that satisfies the request and keep existing ids.

Always return at least one action. Every edge must connect ids that exist after your add_node actions, and connect the layers so the end-to-end flow is obvious.`;

/** One canvas mutation the model can request. Flat shape for broad model support. */
const actionSchema = z.object({
  type: z.enum([
    "add_node",
    "move_node",
    "resize_node",
    "update_node_data",
    "delete_node",
    "add_edge",
    "delete_edge",
  ]),
  id: z.string().describe("Target node/edge id (existing id, or a new one for adds)."),
  label: z.string().nullish().describe("Node or edge label."),
  shape: z.enum(SHAPE_VALUES).nullish().describe("Node shape."),
  color: z.enum(COLOR_IDS).nullish().describe("Node palette color id."),
  x: z.number().nullish().describe("Node x position (flow units)."),
  y: z.number().nullish().describe("Node y position (flow units)."),
  width: z.number().nullish().describe("Node width (flow units)."),
  height: z.number().nullish().describe("Node height (flow units)."),
  source: z.string().nullish().describe("Edge source node id."),
  target: z.string().nullish().describe("Edge target node id."),
});

const designSchema = z.object({
  summary: z
    .string()
    .describe("One short sentence describing what you changed, in plain language."),
  actions: z.array(actionSchema).min(1),
});

type DesignAction = z.infer<typeof actionSchema>;

/** Resolves a palette id to its background/text colors, defaulting to the first. */
function resolveColor(colorId: string | null | undefined) {
  return (
    NODE_COLOR_PALETTE.find((c) => c.id === colorId) ?? NODE_COLOR_PALETTE[0]
  );
}

/**
 * Publishes the AI agent's presence + status into the room's shared storage so
 * every participant sees the same progress. The whole object is rewritten each
 * step (it is a plain stored value, not a Live structure).
 */
async function publishAi(
  roomId: string,
  state: { status: AiAgentStatus; message: string; thinking: boolean; cursor: { x: number; y: number } | null },
) {
  const now = Date.now();
  const value: AiPresence = { ...state, updatedAt: now };
  try {
    await liveblocks.mutateStorage(roomId, ({ root }) => {
      root.set("ai", value);
      // Mirror the step into the generic shared status feed so the AI sidebar
      // (and any future spec-generation UI) sees the latest message + active
      // state without coupling to the design-specific `ai` presence shape.
      root.set("ai-status-feed", {
        text: state.message,
        active: state.thinking,
        at: now,
      });
    });
  } catch (error) {
    // Status publishing is best-effort: never let it break the design run.
    logger.warn("design-agent failed to publish AI status", {
      roomId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * The AI design agent. A user prompt is interpreted by Gemini into a list of
 * canvas actions, which are applied to the collaborative React Flow canvas via
 * the Liveblocks flow utilities so all participants see the result in realtime.
 * Progress is published to the shared AI status feed throughout, and the AI's
 * presence (thinking + cursor) is cleared when the run finishes.
 */
export const designAgent = task({
  id: "design-agent",
  run: async (payload: { prompt: string; roomId: string }, { ctx }) => {
    const { prompt, roomId } = payload;
    logger.info("design-agent started", { prompt, roomId });

    try {
      // Step 1 — start: announce that the AI is reading the request.
      await publishAi(roomId, {
        status: "thinking",
        message: "Ghost AI is reading your request…",
        thinking: true,
        cursor: { x: 0, y: 0 },
      });

      // Read the current canvas so the model can make incremental edits.
      let current: { nodes: CanvasNode[]; edges: CanvasEdge[] } = {
        nodes: [],
        edges: [],
      };
      await mutateFlow<CanvasNode, CanvasEdge>(
        { client: liveblocks, roomId },
        (flow) => {
          current = {
            nodes: [...flow.nodes],
            edges: [...flow.edges],
          };
        },
      );

      // Step 2 — processing: ask Gemini to design the system as actions.
      await publishAi(roomId, {
        status: "generating",
        message: "Ghost AI is designing your system…",
        thinking: true,
        cursor: { x: 0, y: 0 },
      });

      const google = createGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const canvasSummary = JSON.stringify({
        nodes: current.nodes.map((n) => ({
          id: n.id,
          label: n.data?.label ?? "",
          shape: n.data?.shape,
          position: n.position,
        })),
        edges: current.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.data?.label ?? "",
        })),
      });

      const { object } = await generateObject({
        model: google("gemini-3.1-flash-lite"),
        schema: designSchema,
        system: SYSTEM_PROMPT,
        prompt: `User request:\n${prompt}\n\nCurrent canvas (JSON):\n${canvasSummary}`,
      });

      const actions = object.actions;
      logger.info("design-agent produced actions", {
        count: actions.length,
        summary: object.summary,
      });

      // Step 3 — applying: namespace newly added ids so they never clobber
      // existing nodes/edges, and remap edge endpoints that point at new nodes.
      const prefix = `ai-${ctx.run.id}`;
      const nodeIdMap = new Map<string, string>();
      for (const action of actions) {
        if (action.type === "add_node") {
          nodeIdMap.set(action.id, `${prefix}-${action.id}`);
        }
      }
      const mapNodeId = (id: string) => nodeIdMap.get(id) ?? id;

      await publishAi(roomId, {
        status: "applying",
        message: "Ghost AI is laying out your design…",
        thinking: true,
        cursor: { x: 0, y: 0 },
      });

      // Apply actions one at a time, moving the AI presence cursor to each one
      // before it lands so collaborators watch the diagram build in realtime.
      // `placed` records each new node's center so edges can route the cursor to
      // the node they connect.
      const placed = new Map<string, { x: number; y: number }>();
      let cursor: { x: number; y: number } = { x: 0, y: 0 };

      for (const action of actions) {
        const { position, message } = describeAction(action, mapNodeId, placed);
        if (action.type === "add_node" && position) {
          placed.set(mapNodeId(action.id), position);
        }
        cursor = position ?? cursor;

        // Move the ghost cursor first, then apply the change a beat later so the
        // cursor visibly travels to where the node/edge appears.
        await publishAi(roomId, {
          status: "applying",
          message,
          thinking: true,
          cursor,
        });
        await sleep(CURSOR_TRAVEL_MS);

        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId },
          (flow) => {
            applyAction(flow, action, mapNodeId, prefix);
          },
        );
        await sleep(STEP_SETTLE_MS);
      }

      // Step 4 — complete: rest the cursor on the last edit, then clear presence.
      await publishAi(roomId, {
        status: "complete",
        message: object.summary || "Ghost AI finished updating the canvas.",
        thinking: false,
        cursor,
      });
      // Clear presence (cursor + thinking) now the run has finished, leaving the
      // final status message visible.
      await publishAi(roomId, {
        status: "complete",
        message: object.summary || "Ghost AI finished updating the canvas.",
        thinking: false,
        cursor: null,
      });

      logger.info("design-agent finished", { roomId, applied: actions.length });
      return { ok: true as const, summary: object.summary, applied: actions.length };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("design-agent failed", { roomId, error: message });

      // Surface the failure in the status feed and clear the AI presence so the
      // canvas is never left with a stuck "thinking" agent.
      await publishAi(roomId, {
        status: "error",
        message: "Ghost AI ran into a problem and couldn't finish.",
        thinking: false,
        cursor: null,
      });

      return { ok: false as const, error: message };
    }
  },
});

/**
 * Computes where the AI presence cursor should travel for an action and a short
 * status-feed message describing the step. For nodes the cursor targets the
 * node's center; for edges it targets the connected node (so the cursor appears
 * to draw the connection). Returns `position: null` when there is nothing
 * positional to point at (the caller keeps the previous cursor).
 */
function describeAction(
  action: DesignAction,
  mapNodeId: (id: string) => string,
  placed: Map<string, { x: number; y: number }>,
): { position: { x: number; y: number } | null; message: string } {
  switch (action.type) {
    case "add_node": {
      const shape = (action.shape ?? "rectangle") as CanvasNodeShape;
      const size = SHAPE_SIZE[shape];
      const width = action.width ?? size.width;
      const height = action.height ?? size.height;
      const position = {
        x: (action.x ?? 0) + width / 2,
        y: (action.y ?? 0) + height / 2,
      };
      return {
        position,
        message: action.label
          ? `Ghost AI is adding “${action.label}”…`
          : "Ghost AI is adding a component…",
      };
    }
    case "move_node":
      return {
        position:
          action.x != null && action.y != null
            ? { x: action.x, y: action.y }
            : null,
        message: "Ghost AI is repositioning a component…",
      };
    case "resize_node":
      return { position: null, message: "Ghost AI is resizing a component…" };
    case "update_node_data":
      return { position: null, message: "Ghost AI is refining a component…" };
    case "delete_node":
      return { position: null, message: "Ghost AI is removing a component…" };
    case "add_edge": {
      const target = action.target ? placed.get(mapNodeId(action.target)) : undefined;
      const source = action.source ? placed.get(mapNodeId(action.source)) : undefined;
      return {
        position: target ?? source ?? null,
        message: "Ghost AI is connecting components…",
      };
    }
    case "delete_edge":
      return { position: null, message: "Ghost AI is removing a connection…" };
  }
}

/**
 * Applies a single design action to the mutable flow. New node/edge ids are
 * namespaced via `mapNodeId`/`prefix`; existing ids pass through unchanged.
 */
function applyAction(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: DesignAction,
  mapNodeId: (id: string) => string,
  prefix: string,
) {
  switch (action.type) {
    case "add_node": {
      const shape = (action.shape ?? "rectangle") as CanvasNodeShape;
      const palette = resolveColor(action.color);
      const size = {
        width: action.width ?? SHAPE_SIZE[shape].width,
        height: action.height ?? SHAPE_SIZE[shape].height,
      };
      const position = { x: action.x ?? 0, y: action.y ?? 0 };
      const node: CanvasNode = {
        id: mapNodeId(action.id),
        type: CANVAS_NODE_TYPE,
        position,
        data: {
          label: action.label ?? "",
          color: palette.background,
          textColor: palette.text,
          shape,
        },
        style: { width: size.width, height: size.height },
      };
      flow.addNode(node);
      break;
    }

    case "move_node": {
      if (action.x == null || action.y == null) {
        break;
      }
      const position = { x: action.x, y: action.y };
      flow.updateNode(mapNodeId(action.id), (node) => ({ ...node, position }));
      break;
    }

    case "resize_node": {
      if (action.width == null || action.height == null) {
        break;
      }
      const { width, height } = action;
      flow.updateNode(mapNodeId(action.id), (node) => ({
        ...node,
        width,
        height,
        style: { ...node.style, width, height },
      }));
      break;
    }

    case "update_node_data": {
      const partial: Partial<CanvasNode["data"]> = {};
      if (action.label != null) partial.label = action.label;
      if (action.shape != null) partial.shape = action.shape as CanvasNodeShape;
      if (action.color != null) {
        const palette = resolveColor(action.color);
        partial.color = palette.background;
        partial.textColor = palette.text;
      }
      if (Object.keys(partial).length > 0) {
        flow.updateNodeData(mapNodeId(action.id), partial);
      }
      break;
    }

    case "delete_node": {
      flow.removeNode(mapNodeId(action.id));
      break;
    }

    case "add_edge": {
      if (!action.source || !action.target) {
        break;
      }
      const edge: CanvasEdge = {
        id: `${prefix}-${action.id}`,
        type: CANVAS_EDGE_TYPE,
        source: mapNodeId(action.source),
        target: mapNodeId(action.target),
        markerEnd: ARROW_MARKER,
        data: action.label ? { label: action.label } : {},
      };
      flow.addEdge(edge);
      break;
    }

    case "delete_edge": {
      flow.removeEdge(action.id);
      break;
    }
  }
}
