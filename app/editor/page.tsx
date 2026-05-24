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
import { useProjectDialog, type Project } from "@/hooks/use-project-dialog"

const MOCK_PROJECTS: Project[] = [
  { id: "1", name: "E-Commerce Platform", slug: "e-commerce-platform", role: "owner" },
  { id: "2", name: "Analytics Dashboard", slug: "analytics-dashboard", role: "owner" },
  { id: "3", name: "Shared Infra Design", slug: "shared-infra-design", role: "collaborator" },
]

export default function EditorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {
    dialog,
    name,
    setName,
    slug,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
  } = useProjectDialog()

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projects={MOCK_PROJECTS}
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
        slug={slug}
        isLoading={isLoading}
        onNameChange={setName}
        onSubmit={close}
        onClose={close}
      />
      <RenameProjectDialog
        open={dialog?.type === "rename"}
        project={dialog?.type === "rename" ? dialog.project : null}
        name={name}
        isLoading={isLoading}
        onNameChange={setName}
        onSubmit={close}
        onClose={close}
      />
      <DeleteProjectDialog
        open={dialog?.type === "delete"}
        project={dialog?.type === "delete" ? dialog.project : null}
        isLoading={isLoading}
        onSubmit={close}
        onClose={close}
      />
    </div>
  )
}
