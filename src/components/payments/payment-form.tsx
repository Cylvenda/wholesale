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
import { formatCurrency } from "@/lib/format"
import {
    inventoryService,
    type Payment,
    type PaymentPayload,
    type Sale,
} from "@/api/services/inventory.service"

type PaymentFormProps = {
    mode: "create" | "edit"
    payment?: Payment | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

const PAYMENT_METHODS = [
    { value: "cash", label: "Cash" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "bank", label: "Bank" },
    { value: "other", label: "Other" },
]

export function PaymentForm({
    mode,
    payment,
    onCancel,
    onSubmit,
}: PaymentFormProps) {
    const [sales, setSales] = useState<Sale[]>([])
    const [sale, setSale] = useState(payment?.sale ?? "")
    const [amount, setAmount] = useState(payment?.amount ?? "")
    const [method, setMethod] = useState(payment?.method ?? "cash")
    const [reference, setReference] = useState(payment?.reference ?? "")
    const [paymentDate, setPaymentDate] = useState(
        payment?.payment_date ?? new Date().toISOString().slice(0, 16)
    )
    const [notes, setNotes] = useState(payment?.notes ?? "")
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const selectedSale = sales.find((s) => s.uuid === sale)
    const saleTotal = selectedSale ? Number(selectedSale.total) : 0
    const paidAmount = selectedSale ? Number(selectedSale.paid_amount || 0) : 0
    const outstandingBalance = saleTotal - paidAmount
    const remainingBalance = outstandingBalance - (amount ? Number(amount) : 0)

    useEffect(() => {
        let active = true

        async function fetchData() {
            try {
                const rows = await inventoryService.listSales()
                if (active) {
                    setSales(
                        rows.filter(
                            (s) =>
                                s.status === "completed" &&
                                (s.payment_status === "unpaid" ||
                                    s.payment_status === "partial")
                        )
                    )
                }
            } catch {
                if (active) {
                    toast.error("Unable to load sales.")
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

        if (!sale) {
            setFormError("Please select a sale.")
            return
        }
        if (!amount || Number(amount) <= 0) {
            setFormError("Payment amount must be greater than zero.")
            return
        }

        setSubmitting(true)

        const payload: PaymentPayload = {
            sale,
            amount,
            method,
            reference: reference.trim() || undefined,
            payment_date: paymentDate,
            notes: notes.trim() || undefined,
        }

        try {
            if (mode === "edit" && payment) {
                await inventoryService.updatePayment(payment.uuid, payload)
                toast.success("Payment updated successfully.")
            } else {
                await inventoryService.createPayment(payload)
                toast.success("Payment recorded successfully.")
            }
            await onSubmit()
        } catch {
            setFormError(
                "Unable to save the payment. Check that the sale is completed and the amount does not exceed the outstanding balance."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Sale</Label>
                <Select
                    value={sale}
                    onValueChange={setSale}
                    disabled={submitting}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select an unpaid or partially paid sale" />
                    </SelectTrigger>
                    <SelectContent>
                        {sales.map((s) => {
                            const paid = Number(s.paid_amount || 0)
                            const remaining = Number(s.total) - paid
                            return (
                                <SelectItem key={s.uuid} value={s.uuid}>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium">
                                            {s.customer_name || "Unknown customer"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatCurrency(s.total)} •{" "}
                                            {remaining > 0
                                                ? `Balance: ${formatCurrency(remaining)}`
                                                : "Fully paid"}
                                        </span>
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
            </div>

            {selectedSale && (
                <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                            Sale total
                        </span>
                        <span className="font-medium">
                            {formatCurrency(saleTotal)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                            Amount paid
                        </span>
                        <span className="font-medium text-blue-600">
                            {formatCurrency(paidAmount)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border/50 pt-2">
                        <span className="text-sm font-medium text-muted-foreground">
                            Remaining balance
                        </span>
                        <span className="font-bold text-amber-600 text-lg">
                            {formatCurrency(outstandingBalance)}
                        </span>
                    </div>
                    {remainingBalance < 0 && (
                        <p
                            role="alert"
                            className="text-sm font-medium text-destructive"
                        >
                            Overpayment: {formatCurrency(Math.abs(remainingBalance))}
                        </p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="payment-amount">Amount</Label>
                    <Input
                        id="payment-amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={submitting}
                        placeholder="0.00"
                        max={outstandingBalance > 0 ? outstandingBalance : undefined}
                    />
                    {selectedSale && (
                        <p className="text-xs text-muted-foreground">
                            Max: {formatCurrency(outstandingBalance)}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="payment-method">Method</Label>
                    <Select
                        value={method}
                        onValueChange={setMethod}
                        disabled={submitting}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PAYMENT_METHODS.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="payment-reference">Reference</Label>
                <Input
                    id="payment-reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    disabled={submitting}
                    placeholder="Receipt or transaction number"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="payment-date">Payment date</Label>
                <Input
                    id="payment-date"
                    type="datetime-local"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    disabled={submitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="payment-notes">Notes</Label>
                <Textarea
                    id="payment-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={submitting}
                    placeholder="Optional notes"
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
                          : "Record payment"}
                </Button>
            </DialogFooter>
        </form>
    )
}
