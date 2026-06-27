"use client"

import { useCallback, useRef, useState } from "react"
import { Share2 } from "lucide-react"
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense"

import { Button } from "@/components/ui/button"
import { ArchonLogo } from "@/components/brand/archon-logo"
import { cn } from "@/lib/utils"
import { AiSidebar } from "@/components/editor/ai-sidebar"
import { CanvasRoom } from "@/components/editor/canvas/canvas-room"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { SaveButton } from "@/components/editor/save-status"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")

  // The canvas (inside the Liveblocks room) registers its save fn here so the
  // navbar Save button can trigger the same write the autosave hook uses.
  const saveRef = useRef<(() => void) | null>(null)
  const registerSave = useCallback((save: () => void) => {
    saveRef.current = save
  }, [])
  const handleSave = useCallback(() => saveRef.current?.(), [])
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
            <SaveButton status={saveStatus} onSave={handleSave} />
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
              className={cn(
                "transition-colors",
                aiOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}
            >
              <ArchonLogo size={17} className="text-current" />
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

      {/* A single Liveblocks room wraps both the canvas and the AI sidebar so
          the sidebar can read shared AI presence/status from the same room
          instead of opening a parallel realtime connection. */}
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={project.id}
          initialPresence={{ cursor: null, thinking: false }}
        >
          <div className="flex min-h-0 flex-1">
            <main className="relative flex min-h-0 flex-1 bg-background">
              <CanvasRoom
                onSaveStatusChange={setSaveStatus}
                onRegisterSave={registerSave}
              />
            </main>

            <AiSidebar isOpen={aiOpen} onClose={() => setAiOpen(false)} />
          </div>
        </RoomProvider>
      </LiveblocksProvider>

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
