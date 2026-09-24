"use client"

import { useCallback, useEffect, useState } from "react"
import { Truck } from "lucide-react"
import { toast } from "react-toastify"
import {
    inventoryService,
    type Supplier,
    type SupplierSummary,
} from "@/api/services/inventory.service"
import { SupplierForm } from "@/components/suppliers/supplier-form"
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
import type { InventoryRow } from "@/lib/inventory-data"
import { formatCurrency } from "@/lib/format"

function toRows(suppliers: Supplier[]): InventoryRow[] {
    return suppliers.map((supplier) => ({
        id: supplier.uuid,
        primary: supplier.name,
        secondary: supplier.phone || "No phone number",
        values: [
            supplier.email || "—",
            supplier.address || "—",
        ],
        status: supplier.is_active ? "active" : "inactive",
    }))
}

function toSummary(summary: SupplierSummary): { label: string; value: string }[] {
    return [
        { label: "Total suppliers", value: String(summary.total_suppliers) },
        { label: "Active suppliers", value: String(summary.active_suppliers) },
        {
            label: "Total purchases",
            value: formatCurrency(summary.total_purchases),
        },
        { label: "Outstanding", value: "See purchases" },
    ]
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [summary, setSummary] = useState<{ label: string; value: string }[]>()

    const loadRows = useCallback(async () => {
        const rows = await inventoryService.listSuppliers()
        setSuppliers(rows)
        return toRows(rows)
    }, [])

    const handleEdit = useCallback(async (row: InventoryRow) => {
        try {
            const supplier = await inventoryService.getSupplier(row.id)
            setEditingSupplier(supplier)
            setFormOpen(true)
        } catch {
            toast.error("Unable to load supplier details.")
        }
    }, [])

    const handleDelete = (row: InventoryRow) => {
        const supplier = suppliers.find((s) => s.uuid === row.id)
        if (supplier) setDeletingSupplier(supplier)
    }

    const handleFormSuccess = async () => {
        await loadRows()
        setFormOpen(false)
        setEditingSupplier(null)
        setRefreshKey((k) => k + 1)
    }

    const handleDeleteConfirm = async () => {
        if (!deletingSupplier) return
        try {
            await inventoryService.deleteSupplier(deletingSupplier.uuid)
            toast.success("Supplier deleted successfully.")
            setDeletingSupplier(null)
            setRefreshKey((k) => k + 1)
        } catch {
            toast.error("Unable to delete this supplier. It may be in use.")
        }
    }

    const loadSummary = useCallback(async () => {
        try {
            const data = await inventoryService.getSuppliersSummary()
            setSummary(toSummary(data))
        } catch {
            // Summary endpoints may not be available on every backend
        }
    }, [])

    useEffect(() => {
        const load = async () => { await loadSummary() }
        load()
    }, [loadSummary])

    return (
        <>
            <ResourcePage
                title="Suppliers"
                description="Manage supplier contacts and wholesale purchasing relationships."
                action="Add supplier"
                columns={["Supplier", "Email", "Address", "Status"]}
                 rows={toRows(suppliers)}
                 summary={summary}
                 loadRows={loadRows}
                 refreshKey={refreshKey}
                 viewIcon={<Truck className="size-5" />}
                 onAction={() => {
                    setEditingSupplier(null)
                    setFormOpen(true)
                }}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-2xl p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSupplier ? "Edit supplier" : "Add supplier"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSupplier
                                ? "Update supplier contact details and status."
                                : "Enter the supplier's contact details and address."}
                        </DialogDescription>
                    </DialogHeader>
                    <SupplierForm
                        mode={editingSupplier ? "edit" : "create"}
                        supplier={editingSupplier}
                        onCancel={() => setFormOpen(false)}
                        onSubmit={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(deletingSupplier)}
                onOpenChange={(open) => !open && setDeletingSupplier(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {deletingSupplier?.name}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Delete supplier
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
