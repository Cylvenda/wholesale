"use client"

import { useCallback, useState } from "react"
import { ShoppingBag } from "lucide-react"
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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ResourcePage } from "@/components/resource-page"
import { ViewDialog } from "@/components/shared/view-dialog"
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
                <DialogContent className="max-h-[95vh] w-[min(96vw,1440px)] max-w-none flex flex-col overflow-hidden">
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

            {viewingPurchase && (
                <ViewDialog
                    open={Boolean(viewingPurchase)}
                    onOpenChange={() => setViewingPurchase(null)}
                    title={
                        viewingPurchase.invoice_number ||
                        `#${viewingPurchase.uuid.slice(0, 8).toUpperCase()}`
                    }
                    description={viewingPurchase.supplier_name || undefined}
                    status={toPurchaseStatus(viewingPurchase.status)}
                    icon={<ShoppingBag className="size-5" />}
                    fields={[
                        { label: "Supplier", value: viewingPurchase.supplier_name || "—" },
                        { label: "Date", value: formatDate(viewingPurchase.purchase_date) },
                        { label: "Status", status: toPurchaseStatus(viewingPurchase.status) },
                        { label: "Total", value: formatCurrency(viewingPurchase.total) },
                        { label: "Notes", value: viewingPurchase.notes || "—" },
                    ]}
                    sections={[
                        {
                            label: "Items",
                            content: (
                                <div className="space-y-2">
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
                            ),
                        },
                    ]}
                    actions={
                        <Button
                            variant="outline"
                            onClick={() => setViewingPurchase(null)}
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
