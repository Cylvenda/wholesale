"use client"

import { useCallback, useState } from "react"
import { toast } from "react-toastify"
import {
    inventoryService,
    type Expense,
} from "@/api/services/inventory.service"
import { ExpenseForm } from "@/components/expenses/expense-form"
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
import { formatCurrency, formatDate } from "@/lib/format"

function toRows(expenses: Expense[]): InventoryRow[] {
    return expenses.map((expense) => ({
        id: expense.uuid,
        primary: expense.category_name,
        secondary: formatDate(expense.expense_date),
        values: [
            formatCurrency(expense.amount),
            expense.description || "—",
        ],
        status: "purchase",
    }))
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [summary] = useState<{ label: string; value: string }[] | undefined>(
        undefined
    )

    const loadRows = useCallback(async () => {
        const rows = await inventoryService.listExpenses()
        setExpenses(rows)
        return toRows(rows)
    }, [])

    const handleEdit = useCallback(async (row: InventoryRow) => {
        try {
            const expense = await inventoryService.getExpense(row.id)
            setEditingExpense(expense)
            setFormOpen(true)
        } catch {
            toast.error("Unable to load expense details.")
        }
    }, [])

    const handleDelete = (row: InventoryRow) => {
        const expense = expenses.find((e) => e.uuid === row.id)
        if (expense) setDeletingExpense(expense)
    }

    const handleFormSuccess = async () => {
        await loadRows()
        setFormOpen(false)
        setEditingExpense(null)
        setRefreshKey((k) => k + 1)
    }

    const handleDeleteConfirm = async () => {
        if (!deletingExpense) return
        try {
            await inventoryService.deleteExpense(deletingExpense.uuid)
            toast.success("Expense deleted successfully.")
            setDeletingExpense(null)
            setRefreshKey((k) => k + 1)
        } catch {
            toast.error("Unable to delete this expense.")
        }
    }

    const totalExpenses = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
    )

    const summaryData = summary ?? [
        { label: "Total expenses", value: formatCurrency(totalExpenses) },
        { label: "Records", value: String(expenses.length) },
        { label: "Avg per record", value: formatCurrency(expenses.length ? totalExpenses / expenses.length : 0) },
        { label: "", value: "" },
    ]

    return (
        <>
            <ResourcePage
                title="Expenses"
                description="Record and manage business expense entries."
                action="Add expense"
                columns={["Category", "Date", "Amount", "Description"]}
                rows={toRows(expenses)}
                summary={summaryData}
                loadRows={loadRows}
                refreshKey={refreshKey}
                onAction={() => {
                    setEditingExpense(null)
                    setFormOpen(true)
                }}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-2xl p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {editingExpense ? "Edit expense" : "Record expense"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingExpense
                                ? "Update the expense details."
                                : "Enter the expense category, amount, and description."}
                        </DialogDescription>
                    </DialogHeader>
                    <ExpenseForm
                        mode={editingExpense ? "edit" : "create"}
                        expense={editingExpense}
                        onCancel={() => setFormOpen(false)}
                        onSubmit={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(deletingExpense)}
                onOpenChange={(open) => !open && setDeletingExpense(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this expense record.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Delete expense
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
