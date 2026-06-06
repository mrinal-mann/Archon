"use client"

import { useState } from "react"
import { Share2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import {
  CreateProjectDialog,
  RenameProjectDialog,
  DeleteProjectDialog,
} from "@/components/editor/project-dialogs"
import { ShareDialog } from "@/components/editor/share-dialog"
import { useProjectActions, type Project } from "@/hooks/use-project-actions"
import type { ProjectRole } from "@/lib/projects"

type EditorWorkspaceProps = {
  project: { id: string; name: string }
  role: ProjectRole
  owned: Project[]
  shared: Project[]
}

export function EditorWorkspace({
  project,
  role,
  owned,
  shared,
}: EditorWorkspaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const {
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
  } = useProjectActions({ activeProjectId: project.id })

  const projects = [...owned, ...shared]

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
        centerContent={<span className="truncate">{project.name}</span>}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Share project"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle AI assistant"
              aria-pressed={aiOpen}
              onClick={() => setAiOpen((prev) => !prev)}
            >
              <Sparkles className="size-5" />
            </Button>
          </>
        }
      />

      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projects={projects}
        activeProjectId={project.id}
        onCreateProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      />

      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 flex-1 items-center justify-center bg-background px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Canvas coming soon. Your architecture diagram will appear here.
          </p>
        </main>

        {aiOpen && (
          <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card text-card-foreground lg:w-80">
            <div className="flex h-12 shrink-0 items-center border-b border-border px-4 text-sm font-medium text-foreground">
              AI Assistant
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              AI chat coming soon.
            </div>
          </aside>
        )}
      </div>

      <CreateProjectDialog
        open={dialog?.type === "create"}
        name={name}
        roomId={roomId}
        isLoading={isLoading}
        onNameChange={setName}
        onSubmit={submitCreate}
        onClose={close}
      />
      <RenameProjectDialog
        open={dialog?.type === "rename"}
        project={dialog?.type === "rename" ? dialog.project : null}
        name={name}
        isLoading={isLoading}
        onNameChange={setName}
        onSubmit={submitRename}
        onClose={close}
      />
      <DeleteProjectDialog
        open={dialog?.type === "delete"}
        project={dialog?.type === "delete" ? dialog.project : null}
        isLoading={isLoading}
        onSubmit={submitDelete}
        onClose={close}
      />
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        projectId={project.id}
        isOwner={role === "owner"}
      />
    </div>
  )
}
