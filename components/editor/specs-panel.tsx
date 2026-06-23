"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { useRoom, useStorage } from "@liveblocks/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MarkdownPreview } from "@/components/editor/markdown-preview"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import {
  AI_CHAT_KEY,
  AI_STATUS_FEED_KEY,
  SPEC_LIMITS,
  parseAiChatMessage,
  parseAiStatusFeedMessage,
} from "@/types/tasks"

/** A spec list item — metadata only, content is fetched lazily on open. */
type SpecListItem = {
  id: string
  filename: string
  createdAt: string
}

/** The full spec, including Markdown content, fetched when a spec is opened. */
type SpecContent = SpecListItem & {
  content: string
}

function formatCreatedAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Triggers a browser download of a spec through the secure download route. The
 * route returns the file with a `Content-Disposition: attachment` header, so a
 * same-origin anchor click lets the browser handle the download — the blob URL
 * is never touched directly.
 */
function downloadSpec(projectId: string, specId: string) {
  const anchor = document.createElement("a")
  anchor.href = `/api/projects/${projectId}/specs/${specId}/download`
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/**
 * Reads the shared `ai-status-feed`, returning whether an AI run is currently
 * active (design or spec), the latest status text, and — once a spec run has
 * finished — the new `ProjectSpec` id. The panel reuses this existing realtime
 * feed (rather than opening a separate run subscription) both to gate the
 * Generate button while the AI works and to refresh the list on completion.
 */
function useAiStatus() {
  const raw = useStorage((root) => root[AI_STATUS_FEED_KEY])
  const status = parseAiStatusFeedMessage(raw)
  return {
    active: status?.active ?? false,
    text: status?.text ?? null,
    // Only surface the spec id once the run is no longer active (persisted).
    completedSpecId: status && !status.active ? (status.specId ?? null) : null,
  }
}

/**
 * Reads the current live canvas + room chat from Liveblocks so a spec request
 * carries the same context the canvas shows. Nodes/edges come from the shared
 * `useLiveblocksFlow` storage (read-only here); chat comes from the `ai-chat`
 * feed. Everything is clamped to the API's accepted limits so the request can
 * never be rejected for being too large.
 */
function useSpecContext() {
  const { nodes, edges } = useLiveblocksFlow<CanvasNode, CanvasEdge>()
  const rawChat = useStorage((root) => root[AI_CHAT_KEY])

  return useCallback(() => {
    const chatHistory = (rawChat ?? [])
      .map((entry) => parseAiChatMessage(entry))
      .filter((m) => m !== null)
      .slice(-SPEC_LIMITS.maxChatMessages)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, SPEC_LIMITS.maxChatChars),
      }))

    return {
      chatHistory,
      nodes: (nodes ?? []).slice(0, SPEC_LIMITS.maxNodes),
      edges: (edges ?? []).slice(0, SPEC_LIMITS.maxEdges),
    }
  }, [nodes, edges, rawChat])
}

export function SpecsPanel() {
  const projectId = useRoom().id

  const [specs, setSpecs] = useState<SpecListItem[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Spec generation — triggers the existing `/api/ai/spec` backend. Progress and
  // completion are surfaced through the shared `ai-status-feed` (the same feed
  // that auto-refreshes the list), so no separate run subscription is needed.
  const { active: aiActive, text: statusText, completedSpecId } = useAiStatus()
  const getSpecContext = useSpecContext()
  const [submitting, setSubmitting] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  // A run is "ours-in-flight" from POST until the feed reports the next idle
  // state, so the button keeps spinning across the request → run handoff.
  const generating = submitting || aiActive

  // Preview modal state — content is fetched only when a spec is opened.
  const [selected, setSelected] = useState<SpecListItem | null>(null)
  const [content, setContent] = useState<SpecContent | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    setRefreshing(true)
    setListError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`)
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = (await res.json()) as { specs?: SpecListItem[] }
      setSpecs(data.specs ?? [])
    } catch {
      setListError("Couldn't load specs.")
      // Keep any previously loaded list visible rather than wiping it.
      setSpecs((prev) => prev ?? [])
    } finally {
      setRefreshing(false)
    }
  }, [projectId])

  // Load the list once on mount. Wrapped in an async IIFE so the fetch's state
  // updates never fire synchronously in the effect body.
  useEffect(() => {
    void (async () => {
      await fetchList()
    })()
  }, [fetchList])

  // Realtime: refresh the list whenever a spec-generation run completes in this
  // room (a new spec id appears on the shared status feed).
  const lastRefreshedSpecId = useRef<string | null>(null)
  useEffect(() => {
    if (!completedSpecId) return
    if (lastRefreshedSpecId.current === completedSpecId) return
    lastRefreshedSpecId.current = completedSpecId
    void (async () => {
      await fetchList()
    })()
  }, [completedSpecId, fetchList])

  // Fetch the selected spec's content lazily when the modal opens. All state
  // updates run inside the async IIFE so none fire synchronously in the effect
  // body.
  useEffect(() => {
    if (!selected) return
    const specId = selected.id
    let cancelled = false
    ;(async () => {
      setContent(null)
      setContentError(null)
      setContentLoading(true)
      try {
        const res = await fetch(`/api/projects/${projectId}/specs/${specId}`)
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const data = (await res.json()) as SpecContent
        if (!cancelled) setContent(data)
      } catch {
        if (!cancelled) setContentError("Couldn't load this spec.")
      } finally {
        if (!cancelled) setContentLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selected, projectId])

  const handleDownload = useCallback(
    (specId: string) => {
      setDownloadingId(specId)
      try {
        downloadSpec(projectId, specId)
      } finally {
        // The browser owns the actual transfer; clear the busy flag shortly after
        // kicking it off so the action re-enables.
        window.setTimeout(() => setDownloadingId(null), 1200)
      }
    },
    [projectId]
  )

  const handleGenerate = useCallback(async () => {
    if (generating) return
    setGenerateError(null)
    setSubmitting(true)
    try {
      const { chatHistory, nodes, edges } = getSpecContext()
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: projectId, chatHistory, nodes, edges }),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      // The run now drives the shared status feed; completion auto-refreshes the
      // list. Nothing more to track locally.
    } catch {
      setGenerateError("Couldn't start spec generation. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }, [generating, getSpecContext, projectId])

  const isInitialLoading = specs === null && refreshing
  const isEmpty = specs !== null && specs.length === 0 && !listError

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border p-3">
        <Button
          type="button"
          disabled={generating}
          onClick={() => void handleGenerate()}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
        >
          {generating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {generating ? "Generating…" : "Generate Spec"}
        </Button>
        {generating && statusText ? (
          <p
            className="mt-2 truncate text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {statusText}
          </p>
        ) : null}
        {generateError ? (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {generateError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Generated specs
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh specs"
          disabled={refreshing}
          onClick={() => void fetchList()}
        >
          <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {isInitialLoading ? (
            <div className="flex flex-col items-center gap-3 px-2 py-10 text-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Loading specs…</p>
            </div>
          ) : listError && (specs === null || specs.length === 0) ? (
            <div className="flex flex-col items-center gap-3 px-2 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="size-6 text-destructive" />
              </div>
              <p className="text-sm text-foreground">{listError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void fetchList()}
              >
                Try again
              </Button>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center gap-3 px-2 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FileText className="size-6 text-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No specs generated yet
              </p>
              <p className="max-w-[16rem] text-xs text-muted-foreground">
                Click Generate Spec to create one from your canvas
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* A transient list error while items are still shown. */}
              {listError ? (
                <p
                  className="rounded-md bg-muted px-2.5 py-1.5 text-xs text-destructive"
                  role="alert"
                >
                  {listError}
                </p>
              ) : null}
              {specs?.map((spec) => (
                <div
                  key={spec.id}
                  className="rounded-lg border border-border bg-muted p-3"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(spec)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background">
                      <FileText className="size-5 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-foreground">
                        Generated Spec
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatCreatedAt(spec.createdAt)}
                      </p>
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    disabled={downloadingId === spec.id}
                    onClick={() => handleDownload(spec.id)}
                  >
                    {downloadingId === spec.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generated Spec</DialogTitle>
            <DialogDescription>
              {selected ? formatCreatedAt(selected.createdAt) : null}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="pr-1">
              {contentLoading ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                  <p className="text-sm">Loading spec…</p>
                </div>
              ) : contentError ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <AlertCircle className="size-6 text-destructive" />
                  <p className="text-sm text-foreground">{contentError}</p>
                  {selected ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Re-trigger the content effect by re-selecting.
                        const current = selected
                        setSelected(null)
                        setSelected(current)
                      }}
                    >
                      Try again
                    </Button>
                  ) : null}
                </div>
              ) : content ? (
                <MarkdownPreview content={content.content} />
              ) : null}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={!selected || contentLoading || downloadingId === selected?.id}
              onClick={() => selected && handleDownload(selected.id)}
            >
              {selected && downloadingId === selected.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
