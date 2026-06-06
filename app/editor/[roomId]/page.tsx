import { redirect } from "next/navigation"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspace } from "@/components/editor/editor-workspace"
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"
import { getUserProjects } from "@/lib/projects"

type EditorRoomPageProps = {
  params: Promise<{ roomId: string }>
}

export default async function EditorRoomPage({ params }: EditorRoomPageProps) {
  const { roomId } = await params

  const identity = await getCurrentIdentity()
  if (!identity) {
    redirect("/sign-in")
  }

  const access = await getProjectAccess(roomId, identity)
  if (!access) {
    return <AccessDenied />
  }

  const { owned, shared } = await getUserProjects()

  return (
    <EditorWorkspace
      project={access.project}
      role={access.role}
      owned={owned}
      shared={shared}
    />
  )
}
