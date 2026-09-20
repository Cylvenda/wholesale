"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import {
    inventoryService,
    type Expense,
    type ExpenseCategory,
    type ExpensePayload,
} from "@/api/services/inventory.service"

type ExpenseFormProps = {
    mode: "create" | "edit"
    expense?: Expense | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

export function ExpenseForm({
    mode,
    expense,
    onCancel,
    onSubmit,
}: ExpenseFormProps) {
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const [category, setCategory] = useState(expense?.category ?? "")
    const [amount, setAmount] = useState(expense?.amount ?? "0.00")
    const [description, setDescription] = useState(expense?.description ?? "")
    const [expenseDate, setExpenseDate] = useState(
        expense?.expense_date
            ? new Date(expense.expense_date).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16)
    )
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function fetchData() {
            try {
                const rows = await inventoryService.listExpenseCategories()
                if (active) {
                    setCategories(rows)
                }
            } catch {
                if (active) {
                    toast.error("Unable to load expense categories.")
                }
            }
        }

        fetchData()
        return () => {
            active = false
        }
    }, [])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError(null)

        if (!category) {
            setFormError("Please select an expense category.")
            return
        }

        const numericAmount = Number(amount)
        if (isNaN(numericAmount) || numericAmount < 0) {
            setFormError("Amount must be a positive number.")
            return
        }

        if (!description.trim()) {
            setFormError("Description is required.")
            return
        }

        setSubmitting(true)

        const payload: ExpensePayload = {
            category,
            amount: numericAmount.toFixed(2),
            description: description.trim(),
            expense_date: expenseDate || new Date().toISOString(),
        }

        try {
            if (mode === "edit" && expense) {
                await inventoryService.updateExpense(expense.uuid, payload)
                toast.success("Expense updated successfully.")
            } else {
                await inventoryService.createExpense(payload)
                toast.success("Expense recorded successfully.")
            }
            await onSubmit()
        } catch (err: unknown) {
            const apiMsg =
                (err as {
                    response?: {
                        data?: {
                            detail?: string
                            amount?: string[]
                        }
                    }
                })?.response?.data

            setFormError(
                apiMsg?.amount?.[0] ||
                    apiMsg?.detail ||
                    "Unable to save the expense. Please review the details and try again."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Category</Label>
                <Select
                    value={category}
                    onValueChange={setCategory}
                    disabled={submitting}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((c) => (
                            <SelectItem key={c.uuid} value={c.uuid}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="expense-amount">Amount</Label>
                    <Input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) =>
                            setAmount(
                                Math.max(0, Number(e.target.value) || 0).toString()
                            )
                        }
                        disabled={submitting}
                        placeholder="0.00"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="expense-date">Expense date</Label>
                    <Input
                        id="expense-date"
                        type="datetime-local"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        disabled={submitting}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="expense-description">Description</Label>
                <Textarea
                    id="expense-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={submitting}
                    placeholder="Enter expense description"
                    rows={3}
                />
            </div>

            {formError && (
                <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                >
                    {formError}
                </p>
            )}

            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting
                        ? mode === "edit"
                            ? "Saving…"
                            : "Recording…"
                        : mode === "edit"
                          ? "Save changes"
                          : "Record expense"}
                </Button>
            </DialogFooter>
        </form>
    )
}
