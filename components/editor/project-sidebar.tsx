"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Project } from "@/hooks/use-project-actions"

type ProjectSidebarProps = {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  onCreateProject: () => void
  onRenameProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  className?: string
}

function EmptyProjectState() {
  return (
    <div className="flex h-full min-h-40 items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
      No projects yet.
    </div>
  )
}

type ProjectItemProps = {
  project: Project
  showActions: boolean
  onRename: (project: Project) => void
  onDelete: (project: Project) => void
}

function ProjectItem({ project, showActions, onRename, onDelete }: ProjectItemProps) {
  return (
    <div className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-muted/20">
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {project.name}
      </span>
      {showActions && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Rename ${project.name}`}
            onClick={() => onRename(project)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${project.name}`}
            onClick={() => onDelete(project)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function ProjectSidebar({
  isOpen,
  onClose,
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  className,
}: ProjectSidebarProps) {
  const ownedProjects = projects.filter((p) => p.role === "owner")
  const sharedProjects = projects.filter((p) => p.role === "collaborator")

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/60 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        data-state={isOpen ? "open" : "closed"}
        aria-hidden={!isOpen}
        className={cn(
          "fixed left-3 top-15 z-40 flex h-[calc(100dvh-4.5rem)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-2xl shadow-background/50 transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1.5rem)]",
          className
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
          <h2 className="text-sm font-medium text-foreground">Projects</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close projects sidebar"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="min-h-0 flex-1 gap-0">
          <div className="border-b border-border px-3 py-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-projects">My Projects</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="my-projects" className="m-0 min-h-0 p-3">
            {ownedProjects.length === 0 ? (
              <EmptyProjectState />
            ) : (
              <div className="space-y-0.5">
                {ownedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    showActions
                    onRename={onRenameProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="shared" className="m-0 min-h-0 p-3">
            {sharedProjects.length === 0 ? (
              <EmptyProjectState />
            ) : (
              <div className="space-y-0.5">
                {sharedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    showActions={false}
                    onRename={onRenameProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="border-t border-border p-3">
          <Button type="button" className="w-full" onClick={onCreateProject}>
            <Plus className="size-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
