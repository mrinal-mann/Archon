"use client"

import {
  Check,
  Loader2,
  Save,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

type StatusConfig = {
  icon: LucideIcon;
  label: string;
  spin?: boolean;
};

const STATUS_CONFIG: Record<SaveStatus, StatusConfig> = {
  idle: { icon: Save, label: "Save" },
  saving: { icon: Loader2, label: "Saving...", spin: true },
  saved: { icon: Check, label: "Saved" },
  error: { icon: TriangleAlert, label: "Error" },
}

type SaveButtonProps = {
  status: SaveStatus;
  onSave: () => void;
};

/**
 * Canvas Save button shown in the editor (workspace) navbar. Reflects the shared
 * autosave status — Save → Saving... → Saved/Error (briefly) → Save — and lets
 * the user trigger the same save manually. Disabled while a save is in flight.
 */
export function SaveButton({ status, onSave }: SaveButtonProps) {
  const { icon: Icon, label, spin } = STATUS_CONFIG[status]
  const isSaving = status === "saving"

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isSaving}
      onClick={onSave}
      className={cn(status === "error" && "text-destructive")}
    >
      <Icon className={cn("size-4", spin && "animate-spin")} />
      {label}
    </Button>
  )
}
