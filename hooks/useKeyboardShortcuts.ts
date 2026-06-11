"use client"

import { useEffect } from "react"
import type { ReactFlowInstance } from "@xyflow/react"

/** Short animation (ms) so keyboard-driven zoom feels smooth, matching the bar. */
const ZOOM_ANIMATION_DURATION = 200

type UseKeyboardShortcutsOptions = {
  /** The React Flow instance, used to drive zoom in/out. */
  reactFlow: Pick<ReactFlowInstance, "zoomIn" | "zoomOut">
  /** Undo handler, wired to Liveblocks history. */
  onUndo: () => void
  /** Redo handler, wired to Liveblocks history. */
  onRedo: () => void
}

/**
 * Returns true when the event originated from a field the user is typing into,
 * so canvas shortcuts never hijack text entry (inline node/edge label editors,
 * inputs, textareas, or any contentEditable region).
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  )
}

/**
 * Wires canvas keyboard shortcuts to the React Flow instance and history
 * handlers:
 *
 * - `+` / `=` zoom in, `-` zoom out
 * - `Cmd/Ctrl + Z` undo, `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` redo
 *
 * Shortcuts are ignored while the user is typing in an editable field.
 */
export function useKeyboardShortcuts({
  reactFlow,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return
      }

      // History shortcuts use the platform modifier (Cmd on macOS, Ctrl
      // elsewhere) and take precedence over the plain zoom keys.
      if (event.metaKey || event.ctrlKey) {
        const key = event.key.toLowerCase()
        if (key === "z") {
          event.preventDefault()
          if (event.shiftKey) {
            onRedo()
          } else {
            onUndo()
          }
        } else if (key === "y") {
          event.preventDefault()
          onRedo()
        }
        return
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        reactFlow.zoomIn({ duration: ZOOM_ANIMATION_DURATION })
      } else if (event.key === "-") {
        event.preventDefault()
        reactFlow.zoomOut({ duration: ZOOM_ANIMATION_DURATION })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [reactFlow, onUndo, onRedo])
}
