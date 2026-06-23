"use client"

import { UserButton } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { useOthers } from "@liveblocks/react/suspense"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

/** Maximum collaborator avatars shown before collapsing into a +N chip. */
const MAX_VISIBLE = 5

/** Derive up to two initials from a display name for the image fallback. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return "?"
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

type CollaboratorAvatarProps = {
  name: string
  avatar?: string
}

/**
 * A single display-only collaborator avatar: profile photo when available,
 * initials otherwise. A subtle ring keeps it readable on the dark canvas.
 */
function CollaboratorAvatar({ name, avatar }: CollaboratorAvatarProps) {
  return (
    <Avatar
      className="size-7 ring-2 ring-border"
      title={name}
      aria-label={name}
    >
      {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
      <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}

/**
 * Floating participant group pinned to the top-right of the canvas. Collaborators
 * (everyone in the room except the current user) appear as an overlapping avatar
 * stack; the current user is represented by the existing Clerk `UserButton`. A
 * divider only appears when at least one collaborator is present.
 */
export function PresenceAvatars() {
  const { user } = useUser()
  const others = useOthers()

  // Exclude any presence entry that belongs to the current Clerk user (e.g. the
  // same account open in another tab) so we never show ourselves twice.
  const collaborators = others.filter((other) => other.id !== user?.id)

  const visible = collaborators.slice(0, MAX_VISIBLE)
  const overflow = collaborators.length - visible.length

  return (
    <div className="pointer-events-none absolute top-6 right-6 z-10 flex">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 shadow-lg">
        {collaborators.length > 0 ? (
          <>
            <div className="flex -space-x-2">
              {visible.map((other) => (
                <CollaboratorAvatar
                  key={other.connectionId}
                  name={other.info.name}
                  avatar={other.info.avatar}
                />
              ))}
              {overflow > 0 ? (
                <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-border">
                  +{overflow}
                </div>
              ) : null}
            </div>
            <div className="h-6 w-px bg-border" aria-hidden />
          </>
        ) : null}
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: { width: "1.75rem", height: "1.75rem" },
            },
          }}
        />
      </div>
    </div>
  )
}
