"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import {
  CreateProjectDialog,
  RenameProjectDialog,
  DeleteProjectDialog,
} from "@/components/editor/project-dialogs"
import { useProjectActions, type Project } from "@/hooks/use-project-actions"

type EditorHomeProps = {
  owned: Project[]
  shared: Project[]
}

export function EditorHome({ owned, shared }: EditorHomeProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
  } = useProjectActions()

  const projects = [...owned, ...shared]

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projects={projects}
        onCreateProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      />
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 bg-muted/10 px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Create a project or open an existing one
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start a new architecture workspace, or choose a project from the
            sidebar.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New Project
        </Button>
      </main>

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
    </div>
  )
}
