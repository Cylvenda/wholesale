"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Receipt } from "lucide-react"
import {
    inventoryService,
    type Sale,
} from "@/api/services/inventory.service"
import { SaleForm } from "@/components/sales/sale-form"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ResourcePage } from "@/components/resource-page"
import { ViewDialog } from "@/components/shared/view-dialog"
import type { InventoryRow, Status } from "@/lib/inventory-data"
import { formatCurrency, formatDate } from "@/lib/format"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"

function toPaymentStatus(status: "unpaid" | "partial" | "paid"): Status {
    return status === "unpaid" ? "pending" : status
}

function toRows(sales: Sale[]): InventoryRow[] {
    return sales.map((sale) => ({
        id: sale.uuid,
        primary: sale.customer_name || "Customer unavailable",
        secondary: `#${sale.uuid.slice(0, 8).toUpperCase()}`,
        values: [
            String(sale.items.length),
            formatCurrency(sale.total),
            formatDate(sale.sale_date),
        ],
        status: toPaymentStatus(sale.payment_status),
        raw: sale,
    }))
}

export default function SalesPage() {
    const router = useRouter()
    const [sales, setSales] = useState<Sale[]>([])
    const [editingSale, setEditingSale] = useState<Sale | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancelTarget, setCancelTarget] = useState<Sale | null>(null)
    const [viewingSale, setViewingSale] = useState<Sale | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const loadRows = useCallback(async () => {
        const rows = await inventoryService.listSales()
        setSales(rows)
        return toRows(rows)
    }, [])

    const handleEdit = useCallback(async (row: InventoryRow) => {
        try {
            const sale = await inventoryService.getSale(row.id)
            if (sale.status === "completed") {
                setEditingSale(sale)
                setFormOpen(true)
            } else {
                toast.info(
                    "Only completed sales can be edited."
                )
            }
        } catch {
            toast.error("Unable to load sale details.")
        }
    }, [])

    const handleCancel = (row: InventoryRow) => {
        const sale = sales.find((s) => s.uuid === row.id)
        if (sale) {
            if (sale.status === "completed") {
                setCancelTarget(sale)
                setCancelOpen(true)
            } else {
                toast.info("Only completed sales can be cancelled.")
            }
        }
    }

    const handleView = (row: InventoryRow) => {
        const sale = sales.find((s) => s.uuid === row.id)
        if (sale) setViewingSale(sale)
    }

    const handleViewReceipt = (row: InventoryRow) => {
        router.push(`/receipts/${row.id}`)
    }

    const handleDownloadReceipt = async (row: InventoryRow) => {
        try {
            const report = await inventoryService.downloadReceipt(row.id)
            const url = URL.createObjectURL(report.blob)
            const link = document.createElement("a")
            link.href = url
            link.download = report.filename
            link.click()
            URL.revokeObjectURL(url)
            toast.success("Receipt downloaded.")
        } catch {
            toast.error("Unable to download this receipt.")
        }
    }

    const handlePrintReceipt = (row: InventoryRow) => {
        window.open(`/receipts/${row.id}`, "_blank", "noopener,noreferrer")
    }

    const handleFormSuccess = async () => {
        await loadRows()
        setFormOpen(false)
        setEditingSale(null)
        setRefreshKey((k) => k + 1)
    }

    const handleCancelConfirm = async () => {
        if (!cancelTarget) return
        try {
            await inventoryService.cancelSale(cancelTarget.uuid)
            toast.success("Sale cancelled and stock reversed.")
            setCancelOpen(false)
            setCancelTarget(null)
            setRefreshKey((k) => k + 1)
        } catch {
            toast.error("Unable to cancel this sale.")
        }
    }

    return (
        <>
            <ResourcePage
                title="Sales"
                description="Review wholesale sales and customer payment status."
                action="Record sale"
                columns={["Customer", "Items", "Total", "Date", "Payment status"]}
                rows={toRows(sales)}
                loadRows={loadRows}
                refreshKey={refreshKey}
                onAction={() => {
                    setEditingSale(null)
                    setFormOpen(true)
                }}
                onView={handleView}
                onViewReceipt={handleViewReceipt}
                onDownloadReceipt={handleDownloadReceipt}
                onPrintReceipt={handlePrintReceipt}
                onEdit={handleEdit}
                onDelete={handleCancel}
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-h-[95vh] w-[min(96vw,1440px)] max-w-none flex flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSale ? "Edit sale" : "Record sale"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSale
                                ? "Update the sale details and line items."
                                : "Enter customer details and add line items to record a sale."}
                        </DialogDescription>
                    </DialogHeader>
                    <SaleForm
                        mode={editingSale ? "edit" : "create"}
                        sale={editingSale}
                        onCancel={() => setFormOpen(false)}
                        onSubmit={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>

            {viewingSale && (
                <ViewDialog
                    open={Boolean(viewingSale)}
                    onOpenChange={() => setViewingSale(null)}
                    title={`#${viewingSale.uuid.slice(0, 8).toUpperCase()}`}
                    description={viewingSale.customer_name || undefined}
                    status={toPaymentStatus(viewingSale.payment_status)}
                    icon={<Receipt className="size-5" />}
                    fields={[
                        { label: "Customer", value: viewingSale.customer_name || "—" },
                        { label: "Date", value: formatDate(viewingSale.sale_date) },
                        { label: "Status", status: viewingSale.status as Status },
                        { label: "Payment status", status: toPaymentStatus(viewingSale.payment_status) },
                        { label: "Subtotal", value: formatCurrency(viewingSale.subtotal) },
                        { label: "Total", value: formatCurrency(viewingSale.total) },
                    ]}
                    sections={[
                        {
                            label: "Items",
                            content: (
                                <div className="space-y-2">
                                    {viewingSale.items.map((item) => (
                                        <div
                                            key={item.uuid}
                                            className="flex justify-between text-sm"
                                        >
                                            <span>
                                                {item.product_name} × {item.quantity}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {formatCurrency(item.subtotal)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ),
                        },
                    ]}
                    actions={
                        <Button
                            variant="outline"
                            onClick={() => setViewingSale(null)}
                        >
                            Close
                        </Button>
                    }
                />
            )}

            <AlertDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Cancel sale?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reverse the stock for sale{" "}
                            #{cancelTarget?.uuid.slice(0, 8).toUpperCase()}
                            . This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="outline"
                            onClick={handleCancelConfirm}
                        >
                            Cancel sale
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
