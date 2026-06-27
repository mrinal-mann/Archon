"use client"

import Link from "next/link"
import { FolderOpen, Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArchonLogo } from "@/components/brand/archon-logo"
import { cn } from "@/lib/utils"
import type { Project } from "@/hooks/use-project-actions"

// Active tab gets the high-contrast cream (primary) treatment, matching the
// AI sidebar so both floating panels read as one design language.
const ACTIVE_TAB_CLASS =
  "data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground dark:data-active:border-transparent"

type ProjectSidebarProps = {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  activeProjectId?: string
  onCreateProject: () => void
  onRenameProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  className?: string
}

function EmptyProjectState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center">
      <FolderOpen className="size-5 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

type ProjectItemProps = {
  project: Project
  isActive: boolean
  showActions: boolean
  onRename: (project: Project) => void
  onDelete: (project: Project) => void
}

function ProjectItem({
  project,
  isActive,
  showActions,
  onRename,
  onDelete,
}: ProjectItemProps) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors",
        isActive ? "bg-accent" : "hover:bg-muted/40"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full transition-colors",
          isActive ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-muted-foreground/70"
        )}
      />
      <Link
        href={`/editor/${project.id}`}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          isActive ? "font-medium text-foreground" : "text-foreground/90"
        )}
      >
        {project.name}
      </Link>
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
  activeProjectId,
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
          "fixed left-3 top-15 z-40 flex h-[calc(100dvh-4.5rem)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-card/95 text-card-foreground shadow-2xl shadow-background/60 backdrop-blur transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1.5rem)]",
          className
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2">
            <ArchonLogo size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
          </div>
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
              <TabsTrigger value="my-projects" className={ACTIVE_TAB_CLASS}>
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className={ACTIVE_TAB_CLASS}>
                Shared
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="my-projects" className="m-0 min-h-0 p-3">
            {ownedProjects.length === 0 ? (
              <EmptyProjectState label="No projects yet. Create your first one below." />
            ) : (
              <div className="space-y-0.5">
                {ownedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    isActive={project.id === activeProjectId}
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
              <EmptyProjectState label="No shared projects yet." />
            ) : (
              <div className="space-y-0.5">
                {sharedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    isActive={project.id === activeProjectId}
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
