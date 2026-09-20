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
    type StockAdjustmentPayload,
} from "@/api/services/inventory.service"
import {
    productService,
    type Product,
} from "@/api/services/product.service"

type StockAdjustmentFormProps = {
    onCancel: () => void
    onSuccess: () => Promise<void>
}

const MOVEMENT_TYPES = [
    { value: "Stocktake Surplus", label: "Stocktake Surplus (increase)" },
    { value: "Stocktake Loss", label: "Stocktake Loss (decrease)" },
]

export function StockAdjustmentForm({
    onCancel,
    onSuccess,
}: StockAdjustmentFormProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [product, setProduct] = useState("")
    const [movementType, setMovementType] = useState<
        "Stocktake Surplus" | "Stocktake Loss"
    >("Stocktake Surplus")
    const [quantity, setQuantity] = useState("")
    const [reference, setReference] = useState("")
    const [notes, setNotes] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function fetchData() {
            try {
                const rows = await productService.list()
                if (active) setProducts(rows)
            } catch {
                if (active) {
                    toast.error("Unable to load products.")
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

        if (!product) {
            setFormError("Please select a product.")
            return
        }
        if (!quantity || Number(quantity) <= 0) {
            setFormError("Quantity must be greater than zero.")
            return
        }

        setSubmitting(true)

        const payload: StockAdjustmentPayload = {
            product,
            movement_type: movementType,
            quantity: Number(quantity),
            reference: reference.trim() || undefined,
            notes: notes.trim() || undefined,
        }

        try {
            await inventoryService.createStockMovement(payload)
            toast.success("Stock adjustment recorded successfully.")
            await onSuccess()
        } catch {
            setFormError(
                "Unable to record the stock adjustment. " +
                    "For decreases, ensure sufficient stock is available."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Product</Label>
                <Select
                    value={product}
                    onValueChange={setProduct}
                    disabled={submitting}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map((p) => (
                            <SelectItem key={p.uuid} value={p.uuid}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Type</Label>
                <Select
                    value={movementType}
                    onValueChange={(v) => setMovementType(v as typeof movementType)}
                    disabled={submitting}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {MOVEMENT_TYPES.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="adjustment-quantity">Quantity</Label>
                <Input
                    id="adjustment-quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={submitting}
                    placeholder="0"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="adjustment-reference">Reference</Label>
                <Input
                    id="adjustment-reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    disabled={submitting}
                    placeholder="Receipt or stocktake number"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="adjustment-notes">Notes</Label>
                <Textarea
                    id="adjustment-notes"
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
                    {submitting ? "Recording…" : "Record adjustment"}
                </Button>
            </DialogFooter>
        </form>
    )
}
