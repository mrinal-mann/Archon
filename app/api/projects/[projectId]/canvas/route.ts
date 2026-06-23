import { get, put } from "@vercel/blob";

import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/** Empty canvas state returned when nothing has been saved yet. */
const EMPTY_CANVAS = { nodes: [], edges: [] };

/**
 * Persists the latest canvas JSON. The canvas state is uploaded to Vercel Blob
 * and the returned blob URL is stored on the project record (Prisma keeps only
 * the pointer, not the canvas itself). Owner or collaborator access required.
 */
export async function PUT(req: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const access = await getProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const nodes = (body as { nodes?: unknown })?.nodes;
  const edges = (body as { edges?: unknown })?.edges;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return Response.json({ error: "Invalid canvas state" }, { status: 400 });
  }

  // Upload the canvas JSON to Vercel Blob under a stable per-project path so
  // each save overwrites the previous snapshot. The store is private, so the
  // blob requires authentication to read back.
  const blob = await put(
    `canvas/${projectId}.json`,
    JSON.stringify({ nodes, edges }),
    {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    }
  );

  // Store only the blob URL pointer on the Prisma project record.
  await withDbRetry(() =>
    prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    })
  );

  return Response.json({ url: blob.url });
}

/**
 * Loads the saved canvas state. Reads the project's saved blob URL from Prisma,
 * fetches the canvas JSON from Vercel Blob, and returns it to the editor. Falls
 * back to an empty canvas when nothing has been saved or the blob is missing.
 * Owner or collaborator access required.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const access = await getProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = await withDbRetry(() =>
    prisma.project.findUnique({ where: { id: projectId } })
  );
  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  if (!project.canvasJsonPath) {
    return Response.json(EMPTY_CANVAS);
  }

  try {
    // The blob lives in a private store, so read it through the SDK (which
    // authenticates with BLOB_READ_WRITE_TOKEN) rather than a plain fetch.
    const result = await get(project.canvasJsonPath, {
      access: "private",
      useCache: false,
    });
    if (!result?.stream) {
      return Response.json(EMPTY_CANVAS);
    }
    const data = (await new Response(result.stream).json()) as {
      nodes?: unknown;
      edges?: unknown;
    };
    return Response.json({
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
      edges: Array.isArray(data.edges) ? data.edges : [],
    });
  } catch {
    return Response.json(EMPTY_CANVAS);
  }
}
