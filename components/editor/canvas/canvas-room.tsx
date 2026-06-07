"use client"

import { Component, type ReactNode } from "react"
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense"

import { Canvas } from "@/components/editor/canvas/canvas"

type CanvasRoomProps = {
  roomId: string
}

/**
 * Sets up the Liveblocks room for the collaborative canvas: authenticates
 * through the project auth endpoint, joins the project's room, and renders the
 * synced React Flow canvas behind a loading and error fallback.
 */
export function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, isThinking: false }}>
        <CanvasErrorBoundary>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <Canvas />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
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
