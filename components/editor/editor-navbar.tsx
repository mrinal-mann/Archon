"use client"

import * as React from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EditorNavbarProps = {
  isSidebarOpen: boolean
  onSidebarToggle: () => void
  centerContent?: React.ReactNode
  className?: string
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  centerContent,
  className,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen

  return (
    <header
      className={cn(
        "grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b border-border bg-background px-3",
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-start">
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
      </div>

      <div className="flex min-w-0 items-center justify-center text-sm font-medium text-foreground">
        {centerContent}
      </div>

      <div className="flex min-w-0 items-center justify-end">
        <UserButton />
      </div>
    </header>
  )
}

