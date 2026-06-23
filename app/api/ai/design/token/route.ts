import { auth as triggerAuth } from "@trigger.dev/sdk";

import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";

/**
 * Issues a Trigger.dev public token scoped to a single run. Ownership is
 * verified against the TaskRun record so a user can only read runs they
 * started. The token lets the client subscribe to that run in realtime.
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

  const runId = (body as { runId?: unknown })?.runId;
  if (typeof runId !== "string" || runId.trim().length === 0) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const taskRun = await withDbRetry(() =>
    prisma.taskRun.findUnique({ where: { runId } })
  );
  if (!taskRun || taskRun.userId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [runId],
      },
    },
  });

  return Response.json({ token });
}
