import type { ReactNode } from "react"
import { AlertCircle, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function TableSkeleton() { return <div className="space-y-3 p-3">{Array.from({ length: 5 }, (_, i) => <Skeleton className="h-11 w-full" key={i} />)}<span className="sr-only">Loading table data</span></div> }
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="flex min-h-56 flex-col items-center justify-center px-4 py-10 text-center"><div className="flex size-10 items-center justify-center rounded-md bg-muted"><Inbox className="size-5 text-muted-foreground" /></div><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>{action && <div className="mt-4">{action}</div>}</div> }
export function ErrorState({ onRetry }: { onRetry?: () => void }) { return <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center"><AlertCircle className="size-6 text-destructive" /><h3 className="mt-3 text-sm font-semibold">Unable to load records</h3><p className="mt-1 text-sm text-muted-foreground">Please try again. If the issue continues, contact an administrator.</p>{onRetry && <Button variant="outline" className="mt-4" onClick={onRetry}>Try again</Button>}</div> }
