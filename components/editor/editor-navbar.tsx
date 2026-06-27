"use client"

import * as React from "react"
import Link from "next/link"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { ArchonLogo } from "@/components/brand/archon-logo"
import { cn } from "@/lib/utils"

type EditorNavbarProps = {
  isSidebarOpen: boolean
  onSidebarToggle: () => void
  centerContent?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  centerContent,
  actions,
  className,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen

  return (
    <header
      className={cn(
        "grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b border-border bg-background/85 px-3 backdrop-blur",
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-start gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-pressed={isSidebarOpen}
          onClick={onSidebarToggle}
        >
          <SidebarIcon className="size-5" />
        </Button>
        <Link
          href="/editor"
          aria-label="Go to Archon home"
          className="ml-0.5 flex select-none items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent"
        >
          <ArchonLogo size={20} className="text-primary" />
          <span className="hidden text-sm font-bold tracking-[0.22em] text-foreground sm:inline">
            ARCHON
          </span>
        </Link>
      </div>

      <div className="flex min-w-0 items-center justify-center text-sm font-medium text-foreground">
        {centerContent}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2.5">
        {actions}
        <UserButton />
      </div>
    </header>
  )
}

