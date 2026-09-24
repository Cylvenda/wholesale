"use client"

import { useCallback, useEffect, useState } from "react"
import { CreditCard } from "lucide-react"
import {
    inventoryService,
    type Payment,
    type PaymentSummary,
} from "@/api/services/inventory.service"
import { PaymentForm } from "@/components/payments/payment-form"
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
import type { InventoryRow } from "@/lib/inventory-data"
import { formatCurrency, formatDate } from "@/lib/format"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"

function toRows(payments: Payment[]): InventoryRow[] {
    return payments.map((payment) => ({
        id: payment.uuid,
        primary: payment.customer_name || "Customer unavailable",
        secondary:
            payment.reference ||
            `#${payment.uuid.slice(0, 8).toUpperCase()}`,
        values: [
            formatCurrency(payment.amount),
            payment.method.replaceAll("_", " "),
            formatDate(payment.payment_date),
        ],
        status: "paid",
    }))
}

function toSummary(
    summary: PaymentSummary
): { label: string; value: string }[] {
    return [
        {
            label: "Today's payments",
            value: formatCurrency(summary.today_payments),
        },
        {
            label: "Total paid",
            value: formatCurrency(summary.total_paid),
        },
        {
            label: "Outstanding",
            value: formatCurrency(summary.outstanding),
        },
        {
            label: "Pending sales",
            value: String(summary.pending),
        },
    ]
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
    const [viewingPayment, setViewingPayment] = useState<Payment | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null)
    const [summary, setSummary] = useState<
        { label: string; value: string }[] | undefined
    >()
    const [refreshKey, setRefreshKey] = useState(0)

    const loadRows = useCallback(async () => {
        const rows = await inventoryService.listPayments()
        setPayments(rows)
        return toRows(rows)
    }, [])

    const loadSummary = useCallback(async () => {
        try {
            const data = await inventoryService.getPaymentsSummary()
            setSummary(toSummary(data))
        } catch {
            // Summary may not be available
        }
    }, [])

    useEffect(() => {
        const load = async () => { await loadSummary() }
        load()
    }, [loadSummary])

    const handleEdit = useCallback(async (row: InventoryRow) => {
        try {
            const payment = await inventoryService.getPayment(row.id)
            setEditingPayment(payment)
            setFormOpen(true)
        } catch {
            toast.error("Unable to load payment details.")
        }
    }, [])

    const handleDelete = (row: InventoryRow) => {
        const payment = payments.find((p) => p.uuid === row.id)
        if (payment) setDeletingPayment(payment)
    }

    const handleView = (row: InventoryRow) => {
        const payment = payments.find((p) => p.uuid === row.id)
        if (payment) setViewingPayment(payment)
    }

    const handleFormSuccess = async () => {
        await loadRows()
        setFormOpen(false)
        setEditingPayment(null)
        setRefreshKey((k) => k + 1)
    }

    const handleDeleteConfirm = async () => {
        if (!deletingPayment) return
        try {
            await inventoryService.deletePayment(deletingPayment.uuid)
            toast.success("Payment deleted successfully.")
            setDeletingPayment(null)
            setRefreshKey((k) => k + 1)
        } catch {
            toast.error("Unable to delete this payment.")
        }
    }

    return (
        <>
            <ResourcePage
                title="Payments"
                description="Track incoming and outgoing payments across your business."
                action="Record payment"
                columns={["Customer", "Amount", "Method", "Date", "Status"]}
                summary={summary}
                rows={toRows(payments)}
                loadRows={loadRows}
                refreshKey={refreshKey}
                 onAction={() => {
                     setEditingPayment(null)
                     setFormOpen(true)
                 }}
                 onView={handleView}
                 onEdit={handleEdit}
                 onDelete={handleDelete}
             />

            {viewingPayment && (
                <ViewDialog
                    open={Boolean(viewingPayment)}
                    onOpenChange={() => setViewingPayment(null)}
                    title={`#${viewingPayment.uuid.slice(0, 8).toUpperCase()}`}
                    description={viewingPayment.customer_name || undefined}
                    status="paid"
                    icon={<CreditCard className="size-5" />}
                    fields={[
                        { label: "Customer", value: viewingPayment.customer_name || "—" },
                        { label: "Amount", value: formatCurrency(viewingPayment.amount) },
                        { label: "Method", value: viewingPayment.method.replaceAll("_", " ") },
                        { label: "Reference", value: viewingPayment.reference || "—" },
                        { label: "Date", value: formatDate(viewingPayment.payment_date) },
                    ]}
                    sections={[
                        {
                            label: "Notes",
                            content: (
                                <p className="text-sm text-foreground">
                                    {viewingPayment.notes || "No notes provided."}
                                </p>
                            ),
                        },
                    ]}
                    actions={
                        <Button
                            variant="outline"
                            onClick={() => setViewingPayment(null)}
                        >
                            Close
                        </Button>
                    }
                />
            )}

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-2xl p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPayment ? "Edit payment" : "Record payment"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPayment
                                ? "Update the payment details."
                                : "Select a completed sale and record a payment against it."}
                        </DialogDescription>
                    </DialogHeader>
                    <PaymentForm
                        mode={editingPayment ? "edit" : "create"}
                        payment={editingPayment}
                        onCancel={() => setFormOpen(false)}
                        onSubmit={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(deletingPayment)}
                onOpenChange={(open) => !open && setDeletingPayment(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete payment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this payment record.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Delete payment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
