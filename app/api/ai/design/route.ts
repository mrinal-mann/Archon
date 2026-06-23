import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";

import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import type { designAgent } from "@/trigger/design-agent";

/**
 * Starts a design generation run. Validates the request, triggers the design
 * task on Trigger.dev, records the run for ownership checks, and returns the
 * run id plus a run-scoped public token so the client can subscribe to it in
 * realtime without a second round trip.
 */
export async function POST(req: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const prompt = (body as { prompt?: unknown })?.prompt;
  const roomId = (body as { roomId?: unknown })?.roomId;
  const projectIdInput = (body as { projectId?: unknown })?.projectId;

  if (
    typeof prompt !== "string" ||
    prompt.trim().length === 0 ||
    typeof roomId !== "string" ||
    roomId.trim().length === 0
  ) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // The Liveblocks room id is the project id in this app, so the optional
  // explicit projectId just overrides it when a caller sends one.
  const projectId =
    typeof projectIdInput === "string" && projectIdInput.trim().length > 0
      ? projectIdInput
      : roomId;

  const access = await getProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof designAgent>("design-agent", {
    prompt,
    roomId,
  });

  await withDbRetry(() =>
    prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
        userId: identity.userId,
      },
    })
  );

  // Issue a run-scoped public token so the client can subscribe to this run's
  // realtime updates. Scoped to the single run id — read-only, nothing else.
  const publicToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [handle.id],
      },
    },
  });

  return Response.json({ runId: handle.id, publicToken });
}
