import { EditorHome } from "@/components/editor/editor-home"
import { getUserProjects } from "@/lib/projects"

export default async function EditorPage() {
  const { owned, shared } = await getUserProjects()

  return <EditorHome owned={owned} shared={shared} />
}
