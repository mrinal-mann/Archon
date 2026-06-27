"use client"

import { useState } from "react"
import { Plus, Boxes } from "lucide-react"

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
      <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-hidden bg-background px-4">
        {/* dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* warm glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary) 9%, transparent), transparent 70%)",
          }}
        />

        <div className="relative flex flex-col items-center gap-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card">
            <Boxes className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Design your next system
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Start a new architecture workspace, or open a project from the
              sidebar and let Archon design it with you.
            </p>
          </div>
          <Button size="lg" onClick={openCreate}>
            <Plus className="size-4" />
            New Project
          </Button>
        </div>
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
