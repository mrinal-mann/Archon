import { tasks } from "@trigger.dev/sdk";

import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import type { generateSpec } from "@/trigger/generate-spec";
import { specRequestSchema } from "@/types/tasks";

/**
 * Starts a spec-generation run. Validates the request (including canvas/chat
 * size limits), resolves and authorizes the project from the room id, triggers
 * the `generate-spec` task, records a `TaskRun` for ownership/access control, and
 * returns the Trigger.dev run id so the client can subscribe to it in realtime.
 *
 * The project id is resolved server-side from the room — a client-supplied
 * `projectId` is never trusted.
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

  // Validate the payload + enforce chat/node/edge size limits. Malformed canvas
  // data is rejected here, before any task is scheduled.
  const parsed = specRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // The Liveblocks room id is the project id in this app. Resolve access from it
  // rather than trusting any client-supplied project id.
  const projectId = roomId;
  const access = await getProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  // Record the run immediately so the token route can verify ownership. The task
  // itself transitions the status from "queued" onward.
  await withDbRetry(() =>
    prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
        userId: identity.userId,
        type: "spec",
        status: "queued",
      },
    })
  );

  return Response.json({ runId: handle.id });
}
