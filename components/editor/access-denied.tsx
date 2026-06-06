import Link from "next/link"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/30 text-muted-foreground">
        <Lock className="size-5" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          You don&apos;t have access to this project, or it no longer exists.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/editor">Back to editor</Link>
      </Button>
    </div>
  )
}
