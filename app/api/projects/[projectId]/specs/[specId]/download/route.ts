import { get } from "@vercel/blob";

import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

type RouteContext = {
  params: Promise<{ projectId: string; specId: string }>;
};

/**
 * Securely serves a generated spec as a downloadable Markdown file.
 *
 * The flow authenticates the user, verifies they can access the project,
 * confirms the requested spec belongs to that project, then reads the Markdown
 * from the private Vercel Blob store and streams it back with download headers.
 * The underlying blob URL is never exposed to the client — downloads are always
 * proxied through this route.
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
  // for a different project is treated as not found rather than leaking its
  // existence.
  const spec = await withDbRetry(() =>
    prisma.projectSpec.findUnique({ where: { id: specId } })
  );
  if (!spec || spec.projectId !== projectId) {
    console.warn("spec download not found", {
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
      console.warn("spec download blob missing", {
        projectId,
        specId,
        userId: identity.userId,
      });
      return Response.json({ error: "Not Found" }, { status: 404 });
    }

    const markdown = await new Response(result.stream).text();
    const filename = `spec-${spec.id}.md`;

    console.info("spec download", {
      projectId,
      specId,
      userId: identity.userId,
    });

    return new Response(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("spec download failed", {
      projectId,
      specId,
      userId: identity.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Failed to fetch spec" }, { status: 502 });
  }
}
