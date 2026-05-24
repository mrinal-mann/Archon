"use client"

import { useState } from "react"

export type Project = {
  id: string
  name: string
  slug: string
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

export function useProjectDialog() {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const slug = toSlug(name)

  function openCreate() {
    setName("")
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

  return {
    dialog,
    name,
    setName,
    slug,
    isLoading,
    setIsLoading,
    openCreate,
    openRename,
    openDelete,
    close,
  }
}
