"use client"

import { useCallback, useState } from "react"
import {
    inventoryService,
    type Purchase as PurchaseType,
} from "@/api/services/inventory.service"
import { PurchaseForm } from "@/components/purchases/purchase-form"
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ResourcePage } from "@/components/resource-page"
import type { InventoryRow, Status } from "@/lib/inventory-data"
import { formatCurrency, formatDate } from "@/lib/format"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"

function toPurchaseStatus(
    status: "draft" | "completed" | "cancelled"
): Status {
    return status === "completed" ? "received" : status
}

function toRows(
    purchases: PurchaseType[],
    supplierNames: Map<string, string>
): InventoryRow[] {
    return purchases.map((purchase) => ({
        id: purchase.uuid,
        primary: supplierNames.get(purchase.supplier) ?? "Supplier unavailable",
        secondary: purchase.invoice_number
            ? purchase.invoice_number
            : `#${purchase.uuid.slice(0, 8).toUpperCase()}`,
        values: [
            String(purchase.items.length),
            formatCurrency(purchase.total),
            formatDate(purchase.purchase_date),
        ],
        status: toPurchaseStatus(purchase.status),
    }))
}

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState<PurchaseType[]>([])
    const [editingPurchase, setEditingPurchase] = useState<PurchaseType | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancelTarget, setCancelTarget] = useState<PurchaseType | null>(null)
    const [viewingPurchase, setViewingPurchase] = useState<PurchaseType | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const [submitting, setSubmitting] = useState(false)

    const loadRows = useCallback(async () => {
        const [rows, suppliers] = await Promise.all([
            inventoryService.listPurchases(),
            inventoryService.listSuppliers(),
        ])
        const supplierNames = new Map(
            suppliers.map((s) => [s.uuid, s.name])
        )
        setPurchases(rows)
        return toRows(rows, supplierNames)
    }, [])

    const handleEdit = useCallback(async (row: InventoryRow) => {
        try {
            const purchase = await inventoryService.getPurchase(row.id)
            if (purchase.status === "completed") {
                setEditingPurchase(purchase)
                setFormOpen(true)
            } else {
                toast.info(
                    "Only received purchases can be edited. Create a new purchase instead."
                )
            }
        } catch {
            toast.error("Unable to load purchase details.")
        }
    }, [])

    const handleCancel = (row: InventoryRow) => {
        const purchase = purchases.find((p) => p.uuid === row.id)
        if (purchase) {
            if (purchase.status === "completed") {
                setCancelTarget(purchase)
                setCancelOpen(true)
            } else {
                toast.info(
                    "Only received purchases can be cancelled."
                )
            }
        }
    }

    const handleView = (row: InventoryRow) => {
        const purchase = purchases.find((p) => p.uuid === row.id)
        if (purchase) setViewingPurchase(purchase)
    }

    const handleFormSuccess = async () => {
        await loadRows()
        setFormOpen(false)
        setEditingPurchase(null)
        setRefreshKey((k) => k + 1)
    }

    const handleCancelConfirm = async () => {
        if (!cancelTarget) return
        setSubmitting(true)
        try {
            await inventoryService.cancelPurchase(cancelTarget.uuid)
            toast.success("Purchase cancelled and stock reversed.")
            setCancelOpen(false)
            setCancelTarget(null)
            setRefreshKey((k) => k + 1)
        } catch {
            toast.error("Unable to cancel this purchase.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <ResourcePage
                title="Purchases"
                description="Manage supplier purchases and incoming stock."
                action="Create purchase"
                columns={["Supplier", "Items", "Total", "Date", "Status"]}
                rows={toRows(purchases, new Map())}
                loadRows={loadRows}
                refreshKey={refreshKey}
                onAction={() => {
                    setEditingPurchase(null)
                    setFormOpen(true)
                }}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleCancel}
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-h-[95vh] max-w-6xl w-full flex flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPurchase ? "Edit purchase" : "Create purchase"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPurchase
                                ? "Update the purchase details and line items."
                                : "Enter supplier details and add line items to record a purchase."}
                        </DialogDescription>
                    </DialogHeader>
                    <PurchaseForm
                        mode={editingPurchase ? "edit" : "create"}
                        purchase={editingPurchase}
                        onCancel={() => setFormOpen(false)}
                        onSubmit={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(viewingPurchase)}
                onOpenChange={() => setViewingPurchase(null)}
            >
                <DialogContent className="max-h-[95vh] max-w-6xl w-full flex flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>
                            {viewingPurchase?.invoice_number ||
                                `#${viewingPurchase?.uuid.slice(0, 8).toUpperCase()}`}
                        </DialogTitle>
                        <DialogDescription>
                            Purchase details and line items.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingPurchase && (
                        <div className="flex-1 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Supplier
                                    </p>
                                    <p className="mt-1">
                                        {viewingPurchase.supplier_name || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Date
                                    </p>
                                    <p className="mt-1">
                                        {formatDate(viewingPurchase.purchase_date)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Status
                                    </p>
                                    <p className="mt-1 capitalize">
                                        {viewingPurchase.status}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Total
                                    </p>
                                    <p className="mt-1">
                                        {formatCurrency(viewingPurchase.total)}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Items
                                </p>
                                <div className="mt-2 space-y-2">
                                    {viewingPurchase.items.map((item) => (
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
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setViewingPurchase(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Cancel purchase?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reverse the stock for purchase{" "}
                            {cancelTarget?.invoice_number ||
                                `#${cancelTarget?.uuid.slice(0, 8).toUpperCase()}`}
                            . This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="outline"
                            onClick={handleCancelConfirm}
                            disabled={submitting}
                        >
                            {submitting ? "Cancelling…" : "Cancel purchase"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
