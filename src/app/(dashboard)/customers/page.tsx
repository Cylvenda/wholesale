"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "react-toastify"
import { inventoryService, type Customer, type CustomerSummary } from "@/api/services/inventory.service"
import { CustomerForm } from "@/components/customers/customer-form"
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

function toRows(customers: Customer[]): InventoryRow[] {
    return customers.map((customer) => ({
        id: customer.uuid,
        primary: customer.name,
        secondary: customer.phone || "No phone number",
        values: [
            customer.email || "—",
            customer.business_location || "—",
        ],
        status: customer.is_active ? "active" : "inactive",
    }))
}

function toSummary(summary: CustomerSummary): { label: string; value: string }[] {
    return [
        { label: "Total customers", value: String(summary.total_customers) },
        { label: "Active customers", value: String(summary.active_customers) },
        { label: "Total sales", value: formatCurrency(summary.total_sales) },
        {
            label: "Outstanding",
            value: formatCurrency(summary.outstanding),
        },
    ]
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const loadRows = useCallback(async () => {
        const rows = await inventoryService.listCustomers()
        setCustomers(rows)
        return toRows(rows)
    }, [])

    const handleEdit = async (row: InventoryRow) => {
        try {
            const customer = await inventoryService.getCustomer(row.id)
            setEditingCustomer(customer)
            setFormOpen(true)
        } catch {
            toast.error("Unable to load customer details.")
        }
    }

    const handleDelete = (row: InventoryRow) => {
        const customer = customers.find((c) => c.uuid === row.id)
        if (customer) setDeletingCustomer(customer)
    }

    const handleFormSuccess = async () => {
        await loadRows()
        setFormOpen(false)
        setEditingCustomer(null)
        setRefreshKey((k) => k + 1)
    }

    const handleDeleteConfirm = async () => {
        if (!deletingCustomer) return
        try {
            await inventoryService.deleteCustomer(deletingCustomer.uuid)
            toast.success("Customer deleted successfully.")
            setDeletingCustomer(null)
            setRefreshKey((k) => k + 1)
        } catch {
            toast.error("Unable to delete this customer. It may be in use.")
        }
    }

    const [summary, setSummary] = useState<{ label: string; value: string }[]>()

    const loadSummary = useCallback(async () => {
        try {
            const data = await inventoryService.getCustomersSummary()
            setSummary(toSummary(data))
        } catch {
            // Summary endpoints may not be available on every backend;
            // the page remains usable without summary cards.
        }
    }, [])

    useEffect(() => {
        const load = async () => { await loadSummary() }
        load()
    }, [loadSummary])

    return (
        <>
            <ResourcePage
                title="Customers"
                description="Keep wholesale customer contacts and trading history organized."
                action="Add customer"
                columns={["Customer", "Email", "Location", "Status"]}
                rows={toRows(customers)}
                summary={summary}
                loadRows={loadRows}
                refreshKey={refreshKey}
                onAction={() => {
                    setEditingCustomer(null)
                    setFormOpen(true)
                }}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-2xl p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCustomer ? "Edit customer" : "Add customer"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCustomer
                                ? "Update customer contact details and status."
                                : "Enter the customer's contact details and business location."}
                        </DialogDescription>
                    </DialogHeader>
                    <CustomerForm
                        mode={editingCustomer ? "edit" : "create"}
                        customer={editingCustomer}
                        onCancel={() => setFormOpen(false)}
                        onSubmit={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(deletingCustomer)}
                onOpenChange={(open) => !open && setDeletingCustomer(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete customer?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {deletingCustomer?.name}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Delete customer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
