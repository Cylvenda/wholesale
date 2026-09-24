"use client"

import type { ReactNode } from "react"
import { CircleUserRound } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import type { Status } from "@/lib/inventory-data"

export type ViewDialogField = {
    label: string
    value?: ReactNode
    status?: Status
}

export type ViewDialogSection = {
    label?: string
    content: ReactNode
}

export type ViewDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    status?: Status
    icon?: ReactNode
    fields: ViewDialogField[]
    sections?: ViewDialogSection[]
    actions?: ReactNode
}

export function ViewDialog({
    open,
    onOpenChange,
    title,
    description,
    status,
    icon,
    fields,
    sections,
    actions,
}: ViewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] w-full max-w-2xl flex flex-col overflow-hidden">
                <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {icon ?? <CircleUserRound className="size-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <DialogTitle className="text-2xl font-bold">
                            {title}
                        </DialogTitle>
                        {description && (
                            <DialogDescription className="mt-1.5 text-sm">
                                {description}
                            </DialogDescription>
                        )}
                        {status && (
                            <div className="mt-3">
                                <StatusBadge status={status} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        {fields.map((field) => (
                            <div key={field.label}>
                                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {field.label}
                                </dt>
                                <dd className="mt-1.5 break-words text-sm text-foreground">
                                    {field.status ? (
                                        <StatusBadge status={field.status} />
                                    ) : field.value !== undefined &&
                                      field.value !== null &&
                                      field.value !== "" ? (
                                        field.value
                                    ) : (
                                        "—"
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {sections && sections.length > 0 && (
                        <div className="mt-6 space-y-6">
                            {sections.map((section, index) => (
                                <div key={index}>
                                    {section.label && (
                                        <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                                            {section.label}
                                        </h4>
                                    )}
                                    {section.content}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {actions && (
                    <div className="-mx-6 -mb-2 flex justify-end gap-2 border-t border-border/60 px-6 py-4">
                        {actions}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
