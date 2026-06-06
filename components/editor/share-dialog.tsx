"use client"

import * as React from "react"
import { Check, Link2, Loader2, Mail, Trash2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Collaborator } from "@/lib/collaborators"

type ShareDialogProps = {
  open: boolean
  onClose: () => void
  projectId: string
  isOwner: boolean
}

type Person = Collaborator & { role: "owner" | "collaborator" }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function initialsFor(person: Person): string {
  const source = person.name ?? person.email
  return source.trim().charAt(0).toUpperCase() || "?"
}

export function ShareDialog({
  open,
  onClose,
  projectId,
  isOwner,
}: ShareDialogProps) {
  const [owner, setOwner] = React.useState<Collaborator | null>(null)
  const [collaborators, setCollaborators] = React.useState<Collaborator[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [isInviting, setIsInviting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [removingEmail, setRemovingEmail] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const projectLink = React.useMemo(() => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/editor/${projectId}`
  }, [projectId])

  const people = React.useMemo<Person[]>(() => {
    const list: Person[] = []
    if (owner) list.push({ ...owner, role: "owner" })
    for (const c of collaborators) list.push({ ...c, role: "collaborator" })
    return list
  }, [owner, collaborators])

  const loadPeople = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`)
      if (!res.ok) throw new Error("Failed to load collaborators")
      const data = (await res.json()) as {
        owner: Collaborator | null
        collaborators: Collaborator[]
      }
      setOwner(data.owner)
      setCollaborators(data.collaborators)
    } catch {
      setError("Could not load collaborators.")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  React.useEffect(() => {
    if (open) {
      void loadPeople()
    }
  }, [open, loadPeople])

  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  function handleClose() {
    setEmail("")
    setError(null)
    setCopied(false)
    onClose()
  }

  async function handleInvite() {
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address.")
      return
    }
    setIsInviting(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      if (!res.ok) throw new Error("Invite failed")
      setEmail("")
      await loadPeople()
    } catch {
      setError("Could not invite that collaborator.")
    } finally {
      setIsInviting(false)
    }
  }

  async function handleRemove(target: string) {
    setRemovingEmail(target)
    setError(null)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators?email=${encodeURIComponent(target)}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Remove failed")
      setCollaborators((prev) => prev.filter((c) => c.email !== target))
    } catch {
      setError("Could not remove that collaborator.")
    } finally {
      setRemovingEmail(null)
    }
  }

  async function handleCopy() {
    if (!projectLink) return
    try {
      await navigator.clipboard.writeText(projectLink)
      setCopied(true)
    } catch {
      setError("Could not copy the link.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            Invite collaborators, copy the workspace link, and manage access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Workspace link
              </p>
              <p className="text-xs text-muted-foreground">
                Share a direct link with teammates after you grant them access.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 className="size-4" />
                  Copy link
                </>
              )}
            </Button>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  className="pl-8"
                  placeholder="teammate@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isInviting) handleInvite()
                  }}
                  disabled={isInviting}
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={handleInvite}
                disabled={isInviting || !email.trim()}
              >
                {isInviting && <Loader2 className="size-4 animate-spin" />}
                Invite
              </Button>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>People with access</Label>
              {!isLoading && (
                <span className="text-xs text-muted-foreground">
                  {people.length} total
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading…
              </div>
            ) : people.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                No one has access yet.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {people.map((person) => (
                  <li
                    key={`${person.role}:${person.email}`}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <Avatar size="sm">
                      {person.imageUrl && (
                        <AvatarImage
                          src={person.imageUrl}
                          alt={person.name ?? person.email}
                        />
                      )}
                      <AvatarFallback>{initialsFor(person)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {person.name ?? person.email}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] tracking-wide uppercase",
                            person.role === "owner"
                              ? "border-primary/40 text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {person.role === "owner" ? "Owner" : "Collaborator"}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {person.email}
                      </p>
                    </div>
                    {isOwner && person.role === "collaborator" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-destructive hover:text-destructive"
                        aria-label={`Remove ${person.email}`}
                        onClick={() => handleRemove(person.email)}
                        disabled={removingEmail === person.email}
                      >
                        {removingEmail === person.email ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
