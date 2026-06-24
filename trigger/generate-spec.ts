import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { put } from "@vercel/blob";
import { generateText } from "ai";

import { liveblocks } from "@/lib/liveblocks";
import { prisma, withDbRetry } from "@/lib/prisma";
import {
  generateSpecPayloadSchema,
  type GenerateSpecPayload,
} from "@/types/tasks";

/**
 * Coarse lifecycle status persisted on the `TaskRun` record. Kept deliberately
 * small (the realtime, human-facing detail lives in the `ai-status-feed`).
 */
type RunStatus = "queued" | "running" | "completed" | "failed";

const SYSTEM_PROMPT = `You are Archon , a senior systems architect. You write clear, structured technical specifications for software systems.

You are given:
- the user's chat history with the assistant (their intent and requirements)
- the current architecture canvas as JSON (nodes = components/services, edges = connections/data flow)

Produce a single technical specification in GitHub-flavored Markdown. Output Markdown ONLY — no preamble, no code fences around the whole document, no closing remarks.

The spec MUST contain these sections, in this exact order, each as a level-2 heading:

## Overview
A concise description of what the system does and the problem it solves, grounded in the chat history and canvas.

## Architecture Summary
A high-level description of the overall architecture and how the major layers fit together.

## Components / Services
A list of the components/services on the canvas. For each, give its responsibility and the shape/role it plays. Derive these from the canvas nodes.

## Data Flow
How requests and data move through the system, end to end, following the canvas edges (connections between nodes).

## Implementation Recommendations
Concrete, actionable recommendations: technology choices, scaling considerations, reliability, and notable trade-offs.

RULES:
- Be deterministic and structured. Prefer bullet lists and short paragraphs over prose.
- Only describe components and connections that exist in the canvas; do not invent unrelated services.
- If the canvas is sparse or empty, infer a reasonable design from the chat history and say so briefly under Overview.
- Keep it focused and professional. Do not include front matter, a title heading, or trailing commentary.`;

/**
 * Builds a compact JSON view of the canvas for the model. Only the fields that
 * matter for a spec (id, label, shape, and edge endpoints/labels) are included,
 * keeping the prompt small and deterministic.
 */
function summarizeCanvas(payload: GenerateSpecPayload) {
  return JSON.stringify({
    nodes: payload.nodes.map((n) => ({
      id: n.id,
      label: (n.data?.label as string | undefined) ?? "",
      shape: n.data?.shape,
    })),
    edges: payload.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: (e.data?.label as string | undefined) ?? "",
    })),
  });
}

/** Renders the chat history into a plain transcript for the prompt. */
function summarizeChat(payload: GenerateSpecPayload) {
  if (payload.chatHistory.length === 0) {
    return "(no chat history)";
  }
  return payload.chatHistory
    .map(
      (m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`,
    )
    .join("\n");
}

/**
 * Updates the persisted `TaskRun.status`. Uses `updateMany` keyed on `runId` so
 * a missing record (e.g. a manually triggered run) is a no-op rather than an
 * error, and wraps the write in the shared transient-error retry.
 */
async function setRunStatus(runId: string, status: RunStatus) {
  try {
    await withDbRetry(() =>
      prisma.taskRun.updateMany({ where: { runId }, data: { status } }),
    );
  } catch (error) {
    // Status persistence is best-effort: never let it fail the run.
    logger.warn("generate-spec failed to persist run status", {
      runId,
      status,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Publishes a status event to the room's shared `ai-status-feed` so every
 * participant sees the same spec-generation progress in the sidebar. Best-effort
 * — a publish failure is logged but never breaks the run.
 */
async function publishStatus(
  roomId: string,
  text: string,
  active: boolean,
  specId?: string,
) {
  try {
    await liveblocks.mutateStorage(roomId, ({ root }) => {
      root.set("ai-status-feed", { text, active, at: Date.now(), specId });
    });
  } catch (error) {
    logger.warn("generate-spec failed to publish status", {
      roomId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Persists a completed spec: the Markdown content is uploaded to Vercel Blob and
 * a `ProjectSpec` metadata record points at the resulting (private) blob URL.
 *
 * The record is created first to obtain a stable spec id, the Markdown is then
 * uploaded to a deterministic per-project path (`project-{projectId}/spec-{specId}.md`,
 * `text/markdown`), and the record's `filePath` is updated with the blob URL.
 * This mirrors the canvas persistence pattern: Prisma stores only the pointer,
 * the content lives in Blob, and the blob is private so it can only be served
 * through the authenticated download route. Returns the new spec id.
 */
async function persistSpec(
  projectId: string,
  spec: string,
  runId: string,
): Promise<string> {
  const record = await withDbRetry(() =>
    prisma.projectSpec.create({ data: { projectId, filePath: "" } }),
  );

  const blob = await put(`project-${projectId}/spec-${record.id}.md`, spec, {
    access: "private",
    contentType: "text/markdown",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  await withDbRetry(() =>
    prisma.projectSpec.update({
      where: { id: record.id },
      data: { filePath: blob.url },
    }),
  );

  logger.info("generate-spec persisted spec", {
    projectId,
    specId: record.id,
    runId,
  });

  return record.id;
}

/**
 * The spec-generation background task. It interprets the user's chat history and
 * the current canvas with Gemini and returns a structured Markdown technical
 * spec. Throughout the run it keeps the `TaskRun` record and the shared
 * `ai-status-feed` in sync (queued -> analyzing canvas -> generating spec ->
 * completed | failed) so the run is trackable in realtime. The generated spec is
 * returned as the task output; nothing is persisted to the canvas or storage.
 */
export const generateSpec = task({
  id: "generate-spec",
  run: async (rawPayload: GenerateSpecPayload, { ctx }) => {
    const runId = ctx.run.id;

    // Defensive boundary: re-validate the payload inside the task. Malformed
    // canvas data is rejected before any model call or status update.
    const parsed = generateSpecPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      logger.error("generate-spec received an invalid payload", {
        runId,
        issues: parsed.error.issues.length,
      });
      await setRunStatus(runId, "failed");
      // No roomId we can trust here, so only the persisted status is updated.
      throw new Error("Invalid spec generation payload");
    }
    const payload = parsed.data;
    const { projectId, roomId } = payload;

    logger.info("generate-spec started", {
      projectId,
      roomId,
      runId,
      nodes: payload.nodes.length,
      edges: payload.edges.length,
    });

    // Announce the run has picked up before any heavy work begins.
    await publishStatus(roomId, "Archon  queued your spec…", true);

    metadata.set("status", "running").set("statusText", "Analyzing canvas");
    await setRunStatus(runId, "running");

    try {
      // Step 1 — analyzing the canvas + chat context.
      await publishStatus(roomId, "Archon  is analyzing your canvas…", true);

      const google = createGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      // Step 2 — generating the spec.
      metadata.set("statusText", "Generating spec");
      await publishStatus(roomId, "Archon  is generating your spec…", true);

      const { text } = await generateText({
        model: google("gemini-3.1-flash-lite"),
        system: SYSTEM_PROMPT,
        prompt: `Chat history:\n${summarizeChat(payload)}\n\nCanvas (JSON):\n${summarizeCanvas(
          payload,
        )}\n\nWrite the technical specification now.`,
      });

      const spec = text.trim();
      if (spec.length === 0) {
        throw new Error("The model returned an empty spec");
      }

      // Step 3 — persist the generated spec to Blob + Prisma so it can be
      // downloaded later. The resulting spec id is attached to the run metadata
      // and the completion status message.
      metadata.set("statusText", "Saving spec");
      const specId = await persistSpec(projectId, spec, runId);

      // Step 4 — completed.
      metadata
        .set("status", "completed")
        .set("statusText", "Spec ready")
        .set("specId", specId);
      await setRunStatus(runId, "completed");
      await publishStatus(roomId, "Archon  finished your spec.", false, specId);

      logger.info("generate-spec completed", {
        projectId,
        roomId,
        runId,
        specId,
        specLength: spec.length,
      });

      return { ok: true as const, spec, specId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("generate-spec failed", {
        projectId,
        roomId,
        runId,
        error: message,
      });

      metadata
        .set("status", "failed")
        .set("statusText", "Spec generation failed");
      await setRunStatus(runId, "failed");
      await publishStatus(
        roomId,
        "Archon  ran into a problem and couldn't finish the spec.",
        false,
      );

      return { ok: false as const, error: message };
    }
  },
});
