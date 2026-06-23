import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * Lists the generated specs for a project as lightweight metadata only.
 *
 * The list payload is intentionally limited to `id`, `filename`, and
 * `createdAt` — the spec content lives in private Blob storage and is fetched
 * lazily (only when a spec is opened) through the single-spec route. The
 * underlying blob URL (`filePath`) is never returned to the client.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  if (!projectId) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Only owners or collaborators may list a project's specs.
  const access = await getProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const specs = await withDbRetry(() =>
      prisma.projectSpec.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true },
      })
    );

    // The model stores no separate filename, so it is derived deterministically
    // from the spec id — matching the name used by the download route.
    const items = specs.map((spec) => ({
      id: spec.id,
      filename: `spec-${spec.id}.md`,
      createdAt: spec.createdAt.toISOString(),
    }));

    return Response.json({ specs: items });
  } catch (error) {
    console.error("spec list failed", {
      projectId,
      userId: identity.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Failed to list specs" }, { status: 502 });
  }
}
