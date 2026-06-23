"use client"

import { useEffect, useState } from "react"
import { Bot, CheckCircle2, Loader2, TriangleAlert } from "lucide-react"
import { useStorage } from "@liveblocks/react/suspense"
import { useViewport } from "@xyflow/react"

import { cn } from "@/lib/utils"
import type { AiPresence as AiPresenceState } from "@/types/canvas"

/** Final states linger this long before the status feed auto-hides. */
const TERMINAL_VISIBLE_MS = 4000

/**
 * Renders the design agent's shared presence and status feed so every
 * participant sees the same live progress. Reads the AI state published into
 * Liveblocks storage by the `design-agent` background task.
 *
 * - A status pill (top-center) reflects each step's message.
 * - A "Ghost AI" cursor follows where the agent is working while it is thinking,
 *   converted from flow coordinates with the current viewport (matching the
 *   live human cursors).
 */
export function AiPresence() {
  const ai = useStorage((root) => root.ai) as AiPresenceState | null | undefined

  if (!ai || ai.status === "idle") {
    return null
  }

  return (
    <>
      <AiStatusPill ai={ai} />
      <AiCursor ai={ai} />
    </>
  )
}

function AiStatusPill({ ai }: { ai: AiPresenceState }) {
  const isTerminal = ai.status === "complete" || ai.status === "error"
  // Tracks which update we've auto-hidden, so a newer update re-shows the pill
  // without a synchronous setState reset in the effect body.
  const [hiddenAt, setHiddenAt] = useState<number | null>(null)

  // Auto-hide the pill a few seconds after a run reaches a terminal state.
  useEffect(() => {
    if (!isTerminal) {
      return
    }
    const timer = setTimeout(() => setHiddenAt(ai.updatedAt), TERMINAL_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [isTerminal, ai.updatedAt])

  if (isTerminal && hiddenAt === ai.updatedAt) {
    return null
  }

  const Icon =
    ai.status === "error"
      ? TriangleAlert
      : ai.status === "complete"
        ? CheckCircle2
        : Loader2

  return (
    <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex justify-center">
      <div
        className={cn(
          "flex max-w-[80%] items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-sm shadow-lg",
          ai.status === "error"
            ? "border-destructive/40 text-destructive"
            : "border-border text-foreground",
        )}
      >
        <Icon className={cn("size-4 shrink-0", ai.thinking && "animate-spin")} />
        <span className="truncate">{ai.message}</span>
      </div>
    </div>
  )
}

function AiCursor({ ai }: { ai: AiPresenceState }) {
  const { x, y, zoom } = useViewport()

  // Only show the moving cursor while the agent is actively working.
  if (!ai.thinking || !ai.cursor) {
    return null
  }

  const left = ai.cursor.x * zoom + x
  const top = ai.cursor.y * zoom + y

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div
        className="absolute top-0 left-0 flex items-start"
        style={{
          transform: `translate(${left}px, ${top}px)`,
          // Glide between published positions so the cursor visibly travels to
          // each node/edge as the agent builds the diagram.
          transition: "transform 300ms ease-out",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-primary">
          <path
            d="M1 1L6.5 15L8.7 9L15 6.5L1 1Z"
            fill="currentColor"
            stroke="white"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
        <span className="mt-3 ml-0.5 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-primary-foreground shadow">
          <Bot className="size-3" />
          Ghost AI
        </span>
      </div>
    </div>
  )
}
