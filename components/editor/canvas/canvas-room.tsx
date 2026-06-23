"use client"

import { Component, type ReactNode } from "react"
import { ClientSideSuspense } from "@liveblocks/react/suspense"

import { Canvas } from "@/components/editor/canvas/canvas"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

type CanvasRoomProps = {
  onSaveStatusChange?: (status: SaveStatus) => void
  onRegisterSave?: (save: () => void) => void
}

/**
 * Renders the synced React Flow canvas behind a loading and error fallback. The
 * Liveblocks provider + room are set up one level up in `EditorWorkspace` so the
 * AI sidebar shares the same room connection.
 */
export function CanvasRoom({
  onSaveStatusChange,
  onRegisterSave,
}: CanvasRoomProps) {
  return (
    <CanvasErrorBoundary>
      <ClientSideSuspense fallback={<CanvasLoading />}>
        <Canvas
          onSaveStatusChange={onSaveStatusChange}
          onRegisterSave={onRegisterSave}
        />
      </ClientSideSuspense>
    </CanvasErrorBoundary>
  )
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Loading canvas…</p>
    </div>
  )
}

function CanvasConnectionError() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background px-4 text-center">
      <p className="text-sm text-muted-foreground">
        Couldn&apos;t connect to the canvas. Please refresh to try again.
      </p>
    </div>
  )
}

type CanvasErrorBoundaryProps = {
  children: ReactNode
}

type CanvasErrorBoundaryState = {
  hasError: boolean
}

/** Catches Liveblocks connection/storage errors and shows a fallback. */
class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <CanvasConnectionError />
    }

    return this.props.children
  }
}
