import { get } from "@vercel/blob";

import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

type RouteContext = {
  params: Promise<{ projectId: string; specId: string }>;
};

/**
 * Returns a single spec's Markdown content for in-app preview.
 *
 * Like the download route, this reads the spec from the private Vercel Blob
 * store server-side and returns the Markdown to the client — the blob URL is
 * never exposed, so the browser never touches Blob directly. Unlike the
 * download route, the content is returned as JSON for rendering (not as an
 * attachment).
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await params;
  if (!projectId || !specId) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify the caller can access the project (owner or collaborator).
  const access = await getProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // The spec must exist and belong to the project named in the path. A spec id
  // for another project is treated as not found rather than leaking existence.
  const spec = await withDbRetry(() =>
    prisma.projectSpec.findUnique({ where: { id: specId } })
  );
  if (!spec || spec.projectId !== projectId) {
    console.warn("spec preview not found", {
      projectId,
      specId,
      userId: identity.userId,
    });
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    // The spec lives in a private blob store, so read it through the SDK (which
    // authenticates with BLOB_READ_WRITE_TOKEN) rather than a plain fetch.
    const result = await get(spec.filePath, {
      access: "private",
      useCache: false,
    });
    if (!result?.stream) {
      console.warn("spec preview blob missing", {
        projectId,
        specId,
        userId: identity.userId,
      });
      return Response.json({ error: "Not Found" }, { status: 404 });
    }

    const content = await new Response(result.stream).text();

    return Response.json({
      id: spec.id,
      filename: `spec-${spec.id}.md`,
      createdAt: spec.createdAt.toISOString(),
      content,
    });
  } catch (error) {
    console.error("spec preview failed", {
      projectId,
      specId,
      userId: identity.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Failed to fetch spec" }, { status: 502 });
  }
}
