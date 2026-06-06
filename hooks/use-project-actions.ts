"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export type Project = {
  id: string
  name: string
  role: "owner" | "collaborator"
}

export type DialogState =
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }
  | null

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

function generateSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

type UseProjectActionsOptions = {
  /**
   * The project currently open in a workspace, if any. When the active project
   * is deleted the user is redirected to `/editor`; otherwise data is refreshed.
   */
  activeProjectId?: string
}

export function useProjectActions({ activeProjectId }: UseProjectActionsOptions = {}) {
  const router = useRouter()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [name, setName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // The Liveblocks room id is the slugified name plus a short unique suffix.
  // It doubles as the project id so the two always stay aligned.
  const roomId = name.trim() ? `${toSlug(name)}-${suffix}` : ""

  function openCreate() {
    setName("")
    setSuffix(generateSuffix())
    setDialog({ type: "create" })
  }

  function openRename(project: Project) {
    setName(project.name)
    setDialog({ type: "rename", project })
  }

  function openDelete(project: Project) {
    setDialog({ type: "delete", project })
  }

  function close() {
    setDialog(null)
  }

  async function submitCreate() {
    const trimmed = name.trim()
    if (!trimmed || isLoading) return

    const id = `${toSlug(trimmed)}-${suffix}`
    setIsLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: trimmed }),
      })
      if (!res.ok) return
      const project: Project = await res.json()
      close()
      router.push(`/editor/${project.id}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function submitRename() {
    if (dialog?.type !== "rename" || isLoading) return
    const trimmed = name.trim()
    if (!trimmed) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${dialog.project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) return
      close()
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  async function submitDelete() {
    if (dialog?.type !== "delete" || isLoading) return
    const { project } = dialog

    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      })
      if (!res.ok) return
      close()
      if (activeProjectId && project.id === activeProjectId) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    dialog,
    name,
    setName,
    roomId,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
    submitCreate,
    submitRename,
    submitDelete,
  }
}
