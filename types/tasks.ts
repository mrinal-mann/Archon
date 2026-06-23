import { z } from "zod"

/**
 * Storage key for the shared AI status feed. A single Liveblocks storage entry
 * holds the most recent status message so every participant in the room sees
 * the same AI activity. Kept generic so design generation and (later) spec
 * generation can both publish through the same feed.
 */
export const AI_STATUS_FEED_KEY = "ai-status-feed" as const

/**
 * Payload schema for a single `ai-status-feed` message. `text` is optional so a
 * message can clear/idle the feed without carrying display text, and so the feed
 * stays generic across the different AI flows that will publish to it.
 */
export const aiStatusFeedMessageSchema = z.object({
  /** Human-readable status text shown in the sidebar. */
  text: z.string().optional(),
  /** Whether the AI is actively working — drives the thinking/active UI. */
  active: z.boolean().optional(),
  /** Epoch ms of this message, so only the most recent one is surfaced. */
  at: z.number().optional(),
  /**
   * Id of the persisted `ProjectSpec` when a spec-generation run completes, so
   * the sidebar can offer a download without exposing the underlying blob URL.
   */
  specId: z.string().optional(),
})

/** A validated AI status feed message. */
export type AiStatusFeedMessage = z.infer<typeof aiStatusFeedMessageSchema>

/**
 * Validates an incoming feed value before it is displayed. Returns the parsed
 * message, or `null` when the value is missing or fails validation, so the UI
 * never renders an untrusted/malformed status.
 */
export function parseAiStatusFeedMessage(
  value: unknown,
): AiStatusFeedMessage | null {
  const result = aiStatusFeedMessageSchema.safeParse(value)
  return result.success ? result.data : null
}

/**
 * Storage key for the realtime room chat feed. A Liveblocks `LiveList` under
 * this key holds the ordered chat messages so every participant in the room
 * sees the same conversation. Kept separate from `ai-status-feed` (AI progress
 * + presence) — this feed is only for human-authored room chat.
 */
export const AI_CHAT_KEY = "ai-chat" as const

/**
 * Payload schema for a single `ai-chat` message. Includes the sender's display
 * name + id, the author role, the message content, and a timestamp so messages
 * can be ordered and attributed in the sidebar.
 */
export const aiChatMessageSchema = z.object({
  /** Stable unique id for the message (used as the React key). */
  id: z.string(),
  /** Clerk/Liveblocks user id of the sender, used to align own messages. */
  senderId: z.string(),
  /** Display name of the sender. */
  sender: z.string(),
  /** Author role. Only "user" for now — AI replies are out of scope. */
  role: z.enum(["user", "assistant"]),
  /** The message text. */
  content: z.string().min(1),
  /** Epoch ms the message was sent, used to render and order the feed. */
  timestamp: z.number(),
})

/** A validated room chat message. */
export type AiChatMessage = z.infer<typeof aiChatMessageSchema>

/**
 * Validates an incoming chat value before it is rendered. Returns the parsed
 * message, or `null` when the value is missing or fails validation, so an
 * invalid message in the feed is skipped instead of breaking the chat.
 */
export function parseAiChatMessage(value: unknown): AiChatMessage | null {
  const result = aiChatMessageSchema.safeParse(value)
  return result.success ? result.data : null
}

/**
 * Upper bounds for a spec-generation request. They cap how much chat + canvas
 * context the caller can submit so a single request can never schedule an
 * unbounded amount of work or blow past the model's context window. Enforced by
 * both the API route and the background task.
 */
export const SPEC_LIMITS = {
  /** Maximum number of chat messages accepted as context. */
  maxChatMessages: 100,
  /** Maximum characters per chat message. */
  maxChatChars: 8_000,
  /** Maximum number of canvas nodes accepted. */
  maxNodes: 300,
  /** Maximum number of canvas edges accepted. */
  maxEdges: 600,
} as const

/**
 * One chat message supplied as context for spec generation. Kept minimal — only
 * the role and text matter for the prompt — and bounded so a single message
 * cannot be arbitrarily large.
 */
export const specChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(SPEC_LIMITS.maxChatChars),
})

/** A validated spec-generation chat context message. */
export type SpecChatMessage = z.infer<typeof specChatMessageSchema>

/**
 * A canvas node as submitted for spec generation. Only the fields the spec model
 * actually reads are validated; anything else is allowed through (`passthrough`)
 * so the full React Flow node can be sent without the schema rejecting it. A
 * node must at least have an `id` — that is what makes the canvas data valid.
 */
export const specNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    data: z
      .object({
        label: z.string().optional(),
        shape: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

/** A validated spec-generation canvas node. */
export type SpecNode = z.infer<typeof specNodeSchema>

/**
 * A canvas edge as submitted for spec generation. Like {@link specNodeSchema},
 * only the structural fields are validated; an edge must connect a `source` to a
 * `target`, otherwise the canvas data is rejected as malformed.
 */
export const specEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    data: z
      .object({ label: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough()

/** A validated spec-generation canvas edge. */
export type SpecEdge = z.infer<typeof specEdgeSchema>

/**
 * The client-supplied portion of a spec-generation request. The `projectId` is
 * deliberately NOT part of this schema — it is resolved server-side from the
 * room so a client cannot request a spec for a project it does not own.
 */
export const specRequestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z
    .array(specChatMessageSchema)
    .max(SPEC_LIMITS.maxChatMessages)
    .default([]),
  nodes: z.array(specNodeSchema).max(SPEC_LIMITS.maxNodes).default([]),
  edges: z.array(specEdgeSchema).max(SPEC_LIMITS.maxEdges).default([]),
})

/** A validated spec-generation request body (without the resolved project). */
export type SpecRequest = z.infer<typeof specRequestSchema>

/**
 * The full payload handed to the `generate-spec` background task. It is the
 * validated request plus the server-resolved `projectId`, so the task can both
 * read the right project context and update the matching `TaskRun` record. The
 * task re-validates this on entry as a defensive boundary.
 */
export const generateSpecPayloadSchema = specRequestSchema.extend({
  projectId: z.string().min(1),
})

/** A validated `generate-spec` task payload. */
export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>
