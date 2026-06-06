import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(projects);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const name =
    typeof (body as { name?: unknown })?.name === "string"
      ? ((body as { name: string }).name.trim() || "Untitled Project")
      : "Untitled Project";

  const description =
    typeof (body as { description?: unknown })?.description === "string"
      ? (body as { description: string }).description
      : undefined;

  // The client supplies the Liveblocks room id as the project id so the two
  // stay aligned. Fall back to the schema's cuid() default when absent.
  const rawId = (body as { id?: unknown })?.id;
  const id =
    typeof rawId === "string" && rawId.trim().length > 0
      ? rawId.trim()
      : undefined;

  const project = await prisma.project.create({
    data: {
      ...(id ? { id } : {}),
      ownerId: userId,
      name,
      description,
    },
  });

  return Response.json(project, { status: 201 });
}
