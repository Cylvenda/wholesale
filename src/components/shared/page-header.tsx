import type { ReactNode } from "react"

export function PageHeader({ eyebrow = "Wholesale operations", title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{eyebrow}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1.5 text-sm text-muted-foreground">{description}</p></div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
}
