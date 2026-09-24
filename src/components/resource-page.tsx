"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Download, Eye, MoreHorizontal, Plus, Printer, Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/table-states"
import { ViewDialog, type ViewDialogField } from "@/components/shared/view-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { InventoryRow } from "@/lib/inventory-data"

type SortDirection = "asc" | "desc"

type ResourcePageProps = {
    title: string
    description: string
    action?: string
    columns: string[]
    rows?: InventoryRow[]
    summary?: { label: string; value: string }[]
    loadRows?: () => Promise<InventoryRow[]>
    refreshKey?: number
    onAction?: () => void
    onView?: (row: InventoryRow) => void
    onViewReceipt?: (row: InventoryRow) => void
    onDownloadReceipt?: (row: InventoryRow) => void
    onPrintReceipt?: (row: InventoryRow) => void
    onEdit?: (row: InventoryRow) => void
    onDelete?: (row: InventoryRow) => void
    viewIcon?: React.ReactNode
}

export function ResourcePage({
    title,
    description,
    action,
    columns,
    rows = [],
    summary,
    loadRows,
    refreshKey = 0,
    onAction,
    onView,
    onViewReceipt,
    onDownloadReceipt,
    onPrintReceipt,
    onEdit,
    onDelete,
    viewIcon,
}: ResourcePageProps) {
    const [search, setSearch] = useState("")
    const [remoteRows, setRemoteRows] = useState<InventoryRow[] | null>(null)
    const [loading, setLoading] = useState(Boolean(loadRows))
    const [error, setError] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [sortColumn, setSortColumn] = useState<number | "status" | null>(null)
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
    const [viewingRow, setViewingRow] = useState<InventoryRow | null>(null)

    const refresh = () => {
        if (!loadRows) return

        setLoading(true)
        setError(false)
        loadRows()
            .then(setRemoteRows)
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (!loadRows) return

        let active = true
        loadRows()
            .then((result) => {
                if (active) setRemoteRows(result)
            })
            .catch(() => {
                if (active) setError(true)
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [loadRows, refreshKey])

    useEffect(() => {
        const reset = () => { setCurrentPage(1) }
        reset()
    }, [search, pageSize])

    const processedRows = useMemo(() => {
        let result = remoteRows ?? rows

        const query = search.toLowerCase()
        result = result.filter((row) => {
            const secondary = row.secondary ?? ""
            const searchable = `${row.primary} ${secondary} ${row.values.join(" ")}`.toLowerCase()
            return searchable.includes(query)
        })

        if (sortColumn !== null) {
            result = [...result].sort((a, b) => {
                let valA: string
                let valB: string

                if (sortColumn === "status") {
                    valA = a.status ?? ""
                    valB = b.status ?? ""
                } else if (sortColumn === 0) {
                    valA = a.primary
                    valB = b.primary
                } else {
                    valA = a.values[sortColumn - 1] ?? ""
                    valB = b.values[sortColumn - 1] ?? ""
                }

                valA = valA.toLowerCase()
                valB = valB.toLowerCase()

                if (valA < valB) return sortDirection === "asc" ? -1 : 1
                if (valA > valB) return sortDirection === "asc" ? 1 : -1
                return 0
            })
        }

        return result
    }, [remoteRows, rows, search, sortColumn, sortDirection])

    const totalRows = processedRows.length
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
    const startIndex = (currentPage - 1) * pageSize
    const paginatedRows = processedRows.slice(startIndex, startIndex + pageSize)

    const showView = true
    const showViewReceipt = Boolean(onViewReceipt)
    const showDownloadReceipt = Boolean(onDownloadReceipt)
    const showPrintReceipt = Boolean(onPrintReceipt)
    const showEdit = Boolean(onEdit)
    const showDelete = Boolean(onDelete)

    const handleSort = (column: number | "status") => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortColumn(column)
            setSortDirection("desc")
        }
    }

    const getSortIndicator = (column: number | "status") => {
        if (sortColumn !== column) return null
        return sortDirection === "asc" ? " ↑" : " ↓"
    }

    const handleView = (row: InventoryRow) => {
        if (onView) {
            onView(row)
        } else {
            setViewingRow(row)
        }
    }

    const getViewFields = (row: InventoryRow): ViewDialogField[] => {
        const fields: ViewDialogField[] = []

        columns.slice(1).forEach((column, index) => {
            if (column.toLowerCase() === "status") return
            const value = row.values[index]
            if (value !== undefined) {
                fields.push({ label: column, value })
            }
        })

        return fields
    }

    const hasStatusColumn = useMemo(
        () => paginatedRows.some((row) => row.status !== undefined),
        [paginatedRows]
    )

    return (
        <>
        <main className="min-h-full bg-muted/30">
            <div className="mx-auto w-full max-w-8xl space-y-6 p-4 sm:p-6">
                <PageHeader
                    title={title}
                    description={description}
                    action={
                        <Button onClick={onAction}>
                            <Plus className="size-4" />
                            {action}
                        </Button>
                    }
                />
                {summary && (
                    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {summary.map((item) => (
                            <Card key={item.label}>
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <p className="mt-2 text-xl font-semibold tracking-tight">
                                        {item.value}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </section>
                )}
                <Card>
                    <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>{title} list</CardTitle>
                            <CardDescription>
                                Review and manage your records.
                            </CardDescription>
                        </div>
                        <div className="flex w-full gap-2 sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-600" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={`Search ${title.toLowerCase()}`}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="outline" size="icon" aria-label={`Filter ${title.toLowerCase()}`}>
                                <SlidersHorizontal className="size-4 text-blue-600" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        {error ? (
                            <ErrorState onRetry={refresh} />
                        ) : loading ? (
                            <TableSkeleton />
                        ) : (
                            <Table className="min-w-[720px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            #
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none pl-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                            onClick={() => handleSort(0)}
                                        >
                                            {columns[0]}
                                            {getSortIndicator(0)}
                                        </TableHead>
                                        {columns.slice(1).map((column, index) => (
                                            <TableHead
                                                key={column}
                                                className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                                onClick={() => handleSort(index + 1)}
                                            >
                                                {column}
                                                {getSortIndicator(index + 1)}
                                            </TableHead>
                                        ))}
                                        {hasStatusColumn && (
                                            <TableHead
                                                className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                                onClick={() => handleSort("status")}
                                            >
                                                Status
                                                {getSortIndicator("status")}
                                            </TableHead>
                                        )}
                                        <TableHead className="w-12 pr-6">
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRows.length ? (
                                        paginatedRows.map((row, rowIndex) => (
                                            <TableRow key={row.id} className="group cursor-pointer" onClick={() => handleView(row)}>
                                                <TableCell className="text-center text-sm text-muted-foreground">
                                                    {startIndex + rowIndex + 1}
                                                </TableCell>
                                                <TableCell className="sticky left-0 z-10 bg-card pl-2 group-hover:bg-muted/50">
                                                    <div className="font-medium">
                                                        {row.primary}
                                                    </div>
                                                    {row.secondary && (
                                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                                            {row.secondary}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                {row.values.map((value, index) => (
                                                    <TableCell
                                                        key={`${row.id}-${index}`}
                                                        className="text-muted-foreground"
                                                    >
                                                        {value}
                                                    </TableCell>
                                                ))}
                                                {row.status && (
                                                    <TableCell>
                                                        <StatusBadge status={row.status} />
                                                    </TableCell>
                                                )}
                                                <TableCell className="sticky right-0 z-10 bg-card pr-3 group-hover:bg-muted/50 sm:pr-6" onClick={(event) => event.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label={`Actions for ${row.primary}`}
                                                            >
                                                                <MoreHorizontal className="size-4 text-blue-600" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="max-w-20">
                                                            {showView && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleView(row)}
                                                                >
                                                                    <Eye className="mr-0.5 size-4" />
                                                                    View details
                                                                </DropdownMenuItem>
                                                            )}
                                                            {showViewReceipt && row.raw?.status === "completed" && (
                                                                <DropdownMenuItem
                                                                    onClick={() => onViewReceipt?.(row)}
                                                                >
                                                                    View receipt
                                                                </DropdownMenuItem>
                                                            )}
                                                            {showDownloadReceipt && row.raw?.status === "completed" && (
                                                                <DropdownMenuItem
                                                                    onClick={() => onDownloadReceipt?.(row)}
                                                                >
                                                                    <Download className="mr-2 size-4" />
                                                                    Download receipt
                                                                </DropdownMenuItem>
                                                            )}
                                                            {showPrintReceipt && row.raw?.status === "completed" && (
                                                                <DropdownMenuItem
                                                                    onClick={() => onPrintReceipt?.(row)}
                                                                >
                                                                    <Printer className="mr-2 size-4" />
                                                                    Print receipt
                                                                </DropdownMenuItem>
                                                            )}
                                                            {showEdit && (
                                                                <DropdownMenuItem
                                                                    onClick={() => onEdit?.(row)}
                                                                >
                                                                    Edit
                                                                </DropdownMenuItem>
                                                            )}
                                                            {showDelete && (
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => onDelete?.(row)}
                                                                >
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length + 3}
                                                className="p-0"
                                            >
                                                <EmptyState
                                                    title={`No ${title.toLowerCase()} found`}
                                                    description={
                                                        search
                                                            ? "Try changing your search terms."
                                                            : `Add your first ${title.toLowerCase().replace(/s$/, "")} to get started.`
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>

                    {totalRows > 0 && (
                        <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="whitespace-nowrap">
                                    Showing {startIndex + 1}-
                                    {Math.min(startIndex + pageSize, totalRows)} of {totalRows}
                                </span>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(val) => setPageSize(Number(val))}
                                >
                                    <SelectTrigger className="h-8  border-border bg-background text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 / page</SelectItem>
                                        <SelectItem value="10">10 / page</SelectItem>
                                        <SelectItem value="25">25 / page</SelectItem>
                                        <SelectItem value="50">50 / page</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:justify-end">
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-9 w-9"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <span className="min-w-24 text-center text-sm font-medium text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-9 w-9"
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </main>

        <ViewDialog
            open={Boolean(viewingRow)}
            onOpenChange={(open) => !open && setViewingRow(null)}
            title={viewingRow?.primary ?? ""}
            description={viewingRow?.secondary}
            status={viewingRow?.status}
            icon={viewIcon}
            fields={viewingRow ? getViewFields(viewingRow) : []}
            actions={
                <Button
                    variant="outline"
                    onClick={() => setViewingRow(null)}
                >
                    Close
                </Button>
            }
        />
        </>
    )
}
