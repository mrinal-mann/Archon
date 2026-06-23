"use client"

import { useUser } from "@clerk/nextjs"
import { useOthers } from "@liveblocks/react/suspense"
import { useViewport } from "@xyflow/react"
import { Loader2 } from "lucide-react"

/**
 * Renders the live cursors of every other participant on top of the canvas.
 *
 * Cursor positions are broadcast in flow coordinates, so they are converted back
 * to on-screen positions using the current viewport transform (pan + zoom). This
 * keeps a collaborator's cursor pinned to the same logical canvas location even
 * when each viewer has panned or zoomed differently. Subscribing to the viewport
 * re-runs this conversion whenever the local user pans or zooms.
 */
export function LiveCursors() {
  const { user } = useUser()
  const others = useOthers()
  const { x, y, zoom } = useViewport()

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {others.map((other) => {
        const cursor = other.presence.cursor
        // Never render the current user, and skip anyone without a cursor.
        if (!cursor || other.id === user?.id) {
          return null
        }

        const color = other.info.cursorColor
        const left = cursor.x * zoom + x
        const top = cursor.y * zoom + y
        // Show a spinner in the badge while this participant is waiting on the
        // AI. `thinking` defaults to false, so a missing flag hides it.
        const isThinking = other.presence.thinking === true

        return (
          <div
            key={other.connectionId}
            className="absolute top-0 left-0 flex items-start"
            style={{ transform: `translate(${left}px, ${top}px)` }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color }}
            >
              <path
                d="M1 1L6.5 15L8.7 9L15 6.5L1 1Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="mt-3 ml-0.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-white shadow"
              style={{ backgroundColor: color }}
            >
              {isThinking ? <Loader2 className="size-3 animate-spin" /> : null}
              {other.info.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
