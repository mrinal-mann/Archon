"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { Project } from "@/hooks/use-project-dialog"

type CreateProjectDialogProps = {
  open: boolean
  name: string
  slug: string
  isLoading: boolean
  onNameChange: (name: string) => void
  onSubmit: () => void
  onClose: () => void
}

export function CreateProjectDialog({
  open,
  name,
  slug,
  isLoading,
  onNameChange,
  onSubmit,
  onClose,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Give your architecture workspace a name.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="create-project-name">Project name</Label>
            <Input
              id="create-project-name"
              autoFocus
              placeholder="My project"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSubmit() }}
            />
          </div>
          {slug && (
            <p className="text-xs text-muted-foreground">
              Slug:{" "}
              <span className="font-mono text-foreground">{slug}</span>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!name.trim() || isLoading}>
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type RenameProjectDialogProps = {
  open: boolean
  project: Project | null
  name: string
  isLoading: boolean
  onNameChange: (name: string) => void
  onSubmit: () => void
  onClose: () => void
}

export function RenameProjectDialog({
  open,
  project,
  name,
  isLoading,
  onNameChange,
  onSubmit,
  onClose,
}: RenameProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>
            Renaming &ldquo;{project?.name}&rdquo;. Enter a new name below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <Label htmlFor="rename-project-name">New name</Label>
          <Input
            id="rename-project-name"
            autoFocus
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSubmit() }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!name.trim() || isLoading}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type DeleteProjectDialogProps = {
  open: boolean
  project: Project | null
  isLoading: boolean
  onSubmit: () => void
  onClose: () => void
}

export function DeleteProjectDialog({
  open,
  project,
  isLoading,
  onSubmit,
  onClose,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{project?.name}&rdquo;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={isLoading}
          >
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
