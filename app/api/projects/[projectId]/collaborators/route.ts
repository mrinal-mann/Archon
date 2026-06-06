import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { enrichCollaborators, enrichOwner } from "@/lib/collaborators";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lists a project's collaborators, enriched with Clerk display name and avatar.
 * Visible to the owner and to collaborators (read access).
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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { collaborators: { orderBy: { createdAt: "asc" } } },
  });
  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const [owner, collaborators] = await Promise.all([
    enrichOwner(project.ownerId),
    enrichCollaborators(project.collaborators.map((c) => c.email)),
  ]);

  return Response.json({ owner, collaborators });
}

/**
 * Invites a collaborator by email. Owner only.
 */
export async function POST(req: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const rawEmail = (body as { email?: unknown })?.email;
  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  // Idempotent: re-inviting an existing collaborator is a no-op.
  await prisma.projectCollaborator.upsert({
    where: { projectId_email: { projectId, email } },
    create: { projectId, email },
    update: {},
  });

  const [collaborator] = await enrichCollaborators([email]);

  return Response.json({ collaborator }, { status: 201 });
}

/**
 * Removes a collaborator by email (passed as the `email` query param).
 * Owner only.
 */
export async function DELETE(req: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  await prisma.projectCollaborator.deleteMany({
    where: { projectId, email },
  });

  return Response.json({ success: true });
}
