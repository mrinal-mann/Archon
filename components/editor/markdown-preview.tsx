"use client"

import type { ComponentPropsWithoutRef } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

/**
 * Renders a spec's Markdown content read-only and safely.
 *
 * `react-markdown` does not render raw HTML by default, so untrusted Markdown
 * cannot inject markup — no extra sanitization step is needed. `remark-gfm`
 * adds GitHub-flavored extensions (tables, strikethrough, task lists). Each
 * element is styled with the app's semantic theme tokens so the preview matches
 * the dark-only design system; no hardcoded colors.
 */
export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-foreground">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ className, ...props }: ComponentPropsWithoutRef<"h1">) => (
            <h1
              className={cn(
                "mt-6 mb-3 text-xl font-semibold text-foreground first:mt-0",
                className
              )}
              {...props}
            />
          ),
          h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
            <h2
              className={cn(
                "mt-6 mb-3 border-b border-border pb-1 text-lg font-semibold text-foreground first:mt-0",
                className
              )}
              {...props}
            />
          ),
          h3: ({ className, ...props }: ComponentPropsWithoutRef<"h3">) => (
            <h3
              className={cn(
                "mt-5 mb-2 text-base font-semibold text-foreground first:mt-0",
                className
              )}
              {...props}
            />
          ),
          h4: ({ className, ...props }: ComponentPropsWithoutRef<"h4">) => (
            <h4
              className={cn(
                "mt-4 mb-2 text-sm font-semibold text-foreground first:mt-0",
                className
              )}
              {...props}
            />
          ),
          p: ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
            <p className={cn("my-3 text-foreground/90", className)} {...props} />
          ),
          ul: ({ className, ...props }: ComponentPropsWithoutRef<"ul">) => (
            <ul
              className={cn(
                "my-3 ml-5 list-disc space-y-1 text-foreground/90 marker:text-muted-foreground",
                className
              )}
              {...props}
            />
          ),
          ol: ({ className, ...props }: ComponentPropsWithoutRef<"ol">) => (
            <ol
              className={cn(
                "my-3 ml-5 list-decimal space-y-1 text-foreground/90 marker:text-muted-foreground",
                className
              )}
              {...props}
            />
          ),
          li: ({ className, ...props }: ComponentPropsWithoutRef<"li">) => (
            <li className={cn("pl-1", className)} {...props} />
          ),
          a: ({ className, ...props }: ComponentPropsWithoutRef<"a">) => (
            <a
              className={cn("text-primary underline underline-offset-2", className)}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          blockquote: ({
            className,
            ...props
          }: ComponentPropsWithoutRef<"blockquote">) => (
            <blockquote
              className={cn(
                "my-3 border-l-2 border-border pl-3 text-muted-foreground italic",
                className
              )}
              {...props}
            />
          ),
          hr: ({ className, ...props }: ComponentPropsWithoutRef<"hr">) => (
            <hr className={cn("my-5 border-border", className)} {...props} />
          ),
          strong: ({ className, ...props }: ComponentPropsWithoutRef<"strong">) => (
            <strong
              className={cn("font-semibold text-foreground", className)}
              {...props}
            />
          ),
          code: ({
            className,
            ...props
          }: ComponentPropsWithoutRef<"code"> & { inline?: boolean }) => {
            // Block code is wrapped in <pre> (styled below); only inline code is
            // chip-styled here. react-markdown passes a language-* class for
            // fenced blocks, which lets us tell the two apart.
            const isBlock = /language-/.test(className ?? "")
            if (isBlock) {
              return (
                <code
                  className={cn("font-mono text-[0.8rem]", className)}
                  {...props}
                />
              )
            }
            return (
              <code
                className={cn(
                  "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8rem] text-foreground",
                  className
                )}
                {...props}
              />
            )
          },
          pre: ({ className, ...props }: ComponentPropsWithoutRef<"pre">) => (
            <pre
              className={cn(
                "my-3 overflow-x-auto rounded-md border border-border bg-muted p-3 text-foreground",
                className
              )}
              {...props}
            />
          ),
          table: ({ className, ...props }: ComponentPropsWithoutRef<"table">) => (
            <div className="my-3 overflow-x-auto rounded-md border border-border">
              <table
                className={cn("w-full border-collapse text-sm", className)}
                {...props}
              />
            </div>
          ),
          thead: ({ className, ...props }: ComponentPropsWithoutRef<"thead">) => (
            <thead className={cn("bg-muted", className)} {...props} />
          ),
          th: ({ className, ...props }: ComponentPropsWithoutRef<"th">) => (
            <th
              className={cn(
                "border border-border px-3 py-2 text-left font-semibold text-foreground",
                className
              )}
              {...props}
            />
          ),
          td: ({ className, ...props }: ComponentPropsWithoutRef<"td">) => (
            <td
              className={cn(
                "border border-border px-3 py-2 text-foreground/90",
                className
              )}
              {...props}
            />
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
