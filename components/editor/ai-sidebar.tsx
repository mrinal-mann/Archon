"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Loader2, Send, X } from "lucide-react";
import { LiveList } from "@liveblocks/client";
import { useMutation, useRoom, useSelf, useStorage } from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { designAgent } from "@/trigger/design-agent";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SpecsPanel } from "@/components/editor/specs-panel";
import { ArchonLogo } from "@/components/brand/archon-logo";
import { cn } from "@/lib/utils";
import {
  AI_CHAT_KEY,
  AI_STATUS_FEED_KEY,
  parseAiChatMessage,
  parseAiStatusFeedMessage,
  type AiChatMessage,
} from "@/types/tasks";

/**
 * Reads the shared AI status from the room's `ai-status-feed` storage entry.
 * Returns only the most recent, validated status message so the whole room
 * sees the same AI activity. `null` while storage is still loading or empty.
 */
function useAiStatus() {
  const raw = useStorage((root) => root[AI_STATUS_FEED_KEY]);
  return parseAiStatusFeedMessage(raw);
}

/**
 * Subscribes to the room's `ai-chat` feed and exposes a sender. Reads the
 * ordered `LiveList`, validating each entry so a malformed message is skipped
 * rather than rendered. `sendMessage` lazily creates the list on first use and
 * pushes the message, so all participants receive it in realtime.
 */
function useRoomChat() {
  const raw = useStorage((root) => root[AI_CHAT_KEY]);

  const messages = useMemo(() => {
    if (!raw) return [] as AiChatMessage[];
    return raw
      .map((entry) => parseAiChatMessage(entry))
      .filter((message): message is AiChatMessage => message !== null);
  }, [raw]);

  const sendMessage = useMutation(({ storage }, message: AiChatMessage) => {
    let list = storage.get(AI_CHAT_KEY);
    if (!list) {
      list = new LiveList<AiChatMessage>([]);
      storage.set(AI_CHAT_KEY, list);
    }
    list.push(message);
  }, []);

  return { messages, sendMessage };
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Identity used for AI-authored chat messages. */
const GHOST_AI_SENDER_ID = "ghost-ai";
const GHOST_AI_SENDER_NAME = "Archon ";

/** Run statuses that mean the design run has finished (success or failure). */
const TERMINAL_RUN_STATUSES = new Set([
  "COMPLETED",
  "CANCELED",
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "INTERRUPTED",
  "TIMED_OUT",
  "EXPIRED",
]);

type AiSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
};

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

// Spec uses tokens from a teal/brand design system (bg-accent, text-accent,
// bg-subtle, text-accent-text). This project is grayscale dark-only, so the
// "accent" tab treatment maps to the high-contrast primary token.
const ACTIVE_TAB_CLASS =
  "data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground dark:data-active:border-transparent";

function ChatBubble({
  message,
  isOwn,
}: {
  message: AiChatMessage;
  isOwn: boolean;
}) {
  return (
    <div
      className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}
    >
      <div className="flex items-center gap-2 px-1 text-[0.7rem] text-muted-foreground">
        <span className="font-medium text-foreground/80">{message.sender}</span>
        <span>{formatTimestamp(message.timestamp)}</span>
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
          isOwn
            ? "border-2 border-primary/40 bg-primary/10 text-foreground"
            : "border border-border bg-muted text-foreground",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function ArchitectTab() {
  const { messages, sendMessage } = useRoomChat();
  const self = useSelf((me) => ({ id: me.id, name: me.info.name }));
  const roomId = useRoom().id;
  const [draft, setDraft] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);

  // The active design run for THIS sidebar instance — only one at a time. We
  // keep the run id and its run-scoped public token together so subscribing and
  // unsubscribing stay in lockstep.
  const [runId, setRunId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Tracks the run we've already finalized so a late/duplicate terminal event
  // (or a stale update from a previous run) never double-posts an AI message.
  const finalizedRef = useRef<string | null>(null);

  const status = useAiStatus();

  /** Appends a Archon  message to the shared chat feed (best-effort). */
  const pushAssistant = useCallback(
    (content: string) => {
      try {
        sendMessage({
          id: crypto.randomUUID(),
          senderId: GHOST_AI_SENDER_ID,
          sender: GHOST_AI_SENDER_NAME,
          role: "assistant",
          content,
          timestamp: Date.now(),
        });
      } catch {
        // The canvas already reflects the result; a missing chat line is benign.
      }
    },
    [sendMessage],
  );

  // Subscribe to the active run in realtime. Disabled (and never throws) until
  // both the run id and its token exist. `onComplete` fires on any terminal
  // state — success or failure — so we finalize there rather than in an effect.
  const { run, error: realtimeError } = useRealtimeRun<typeof designAgent>(
    runId ?? undefined,
    {
      accessToken: accessToken ?? undefined,
      enabled: Boolean(runId && accessToken),
      onComplete: (completed) => {
        // Ignore stale updates from previous runs.
        if (!runId || completed.id !== runId) return;
        if (finalizedRef.current === runId) return;
        finalizedRef.current = runId;

        const output = completed.output;
        const succeeded =
          completed.status === "COMPLETED" && output?.ok !== false;
        // Push an AI message only for completed work (success or a reported
        // failure) — the status feed already carried the live progress.
        pushAssistant(
          succeeded
            ? (output && output.ok ? output.summary?.trim() : "") ||
                "Done — I've updated the canvas."
            : "Archon  ran into a problem and couldn't finish your design.",
        );

        // Clear the active run so the input unlocks for the next request.
        setRunId(null);
        setAccessToken(null);
      },
    },
  );

  // A run is active from submit until it reaches a terminal state. The shared
  // status feed (`status.active`) also drives this so collaborators who did not
  // start the run still see the locked/working state while the AI works.
  const runActive =
    runId !== null && !(run && TERMINAL_RUN_STATUSES.has(run.status));
  const busy = submitting || runActive || (status?.active ?? false);

  // Realtime tracking dropped but the run hasn't ended: stay active and show a
  // reconnecting hint. The hook resumes the subscription on its own.
  const reconnecting = runActive && Boolean(realtimeError);

  const statusText = reconnecting
    ? "Reconnecting to Archon …"
    : (status?.text ?? "Archon  is working…");

  // Keep the newest message in view as the conversation grows.
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = useCallback(async () => {
    if (busy || submitting || !self) return;
    const content = draft.trim();
    if (!content) return;

    // Push the user's prompt into ai-chat immediately, before triggering.
    try {
      sendMessage({
        id: crypto.randomUUID(),
        senderId: self.id,
        sender: self.name,
        role: "user",
        content,
        timestamp: Date.now(),
      });
    } catch {
      setInlineError("Couldn't send your message. Please try again.");
      return;
    }

    setDraft("");
    setInlineError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, roomId }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = (await res.json()) as {
        runId?: string;
        publicToken?: string;
      };
      if (!data.runId || !data.publicToken) {
        throw new Error("Malformed response");
      }

      // Begin tracking the new run (clears any prior finalize guard).
      finalizedRef.current = null;
      setRunId(data.runId);
      setAccessToken(data.publicToken);
    } catch {
      // Restore the input and surface an inline error; no AI message created.
      setDraft(content);
      setInlineError("Archon  couldn't start. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [busy, submitting, self, draft, roomId, sendMessage]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-2 py-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
                <ArchonLogo size={26} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Design with Archon
                </p>
                <p className="mx-auto mt-1.5 max-w-[16rem] text-sm text-muted-foreground">
                  Describe the system you want and Archon will design it on the
                  canvas in real time.
                </p>
              </div>
              <div className="flex w-full flex-col gap-1.5">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setDraft(prompt)}
                    className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === self?.id}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3">
        {/* Compact status strip — shown only while a run is active. Reads the
            latest ai-status-feed message; never renders inside a chat bubble. */}
        {busy ? (
          <div
            className="mb-2 flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs text-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-3.5 shrink-0 animate-spin" />
            <span className="truncate">{statusText}</span>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
            placeholder={busy ? "Archon  is working…" : "Describe a system…"}
            className="max-h-40 min-h-18 flex-1 resize-none"
          />
          <Button
            type="button"
            size="icon"
            aria-label="Send message"
            disabled={busy || !self || draft.trim().length === 0}
            onClick={() => void submit()}
            className="bg-primary text-primary-foreground hover:bg-primary/80"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        {inlineError ? (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {inlineError}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AiSidebar({ isOpen, onClose, className }: AiSidebarProps) {
  return (
    <aside
      data-state={isOpen ? "open" : "closed"}
      aria-hidden={!isOpen}
      className={cn(
        "fixed right-3 top-15 z-40 flex h-[calc(100dvh-4.5rem)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-card/95 text-card-foreground shadow-2xl shadow-background/60 backdrop-blur transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+1.5rem)]",
        className,
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
            <ArchonLogo size={17} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">
              AI Workspace
            </h2>
            <p className="text-xs text-muted-foreground">
              Collaborate with Archon
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close AI sidebar"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-0">
        <div className="border-b border-border px-3 py-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="architect" className={ACTIVE_TAB_CLASS}>
              AI Architect
            </TabsTrigger>
            <TabsTrigger value="specs" className={ACTIVE_TAB_CLASS}>
              Specs
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="architect"
          className="m-0 flex min-h-0 flex-1 flex-col"
        >
          <ArchitectTab />
        </TabsContent>
        <TabsContent value="specs" className="m-0 flex min-h-0 flex-1 flex-col">
          <SpecsPanel />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
