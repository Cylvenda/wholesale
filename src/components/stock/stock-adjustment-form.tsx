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
import { getApiErrorMessage } from "@/lib/api-error"
import {
    inventoryService,
    type StockAdjustmentPayload,
} from "@/api/services/inventory.service"
import {
    productService,
    type Product,
} from "@/api/services/product.service"
import {
    formatUnitConversion,
    parseWholeQuantity,
    toBaseQuantity,
} from "@/lib/product-units"

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
    const [productUnit, setProductUnit] = useState("")
    const [movementType, setMovementType] = useState<
        "Stocktake Surplus" | "Stocktake Loss"
    >("Stocktake Surplus")
    const [quantity, setQuantity] = useState("")
    const [notes, setNotes] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        let active = true

        async function fetchData() {
            try {
                const rows = await productService.list()
                if (active) setProducts(rows)
            } catch (error: unknown) {
                if (active) {
                    toast.error(getApiErrorMessage(error, "Unable to load products."))
                }
            }
        }

        fetchData()
        return () => {
            active = false
        }
    }, [])

    /**
     * Only the ProductUnits configured for the chosen product are offered, so
     * the counted unit always has a real conversion factor behind it.
     */
    const unitsFor = (productUuid: string) =>
        products
            .find((p) => p.uuid === productUuid)
            ?.product_units?.filter((pu) => pu.is_active) ?? []

    const selectedProduct = products.find((p) => p.uuid === product)
    const baseLabel =
        selectedProduct?.base_unit_abbreviation || selectedProduct?.base_unit_name || ""
    const productUnits = unitsFor(product)
    const selectedUnit = productUnits.find((pu) => pu.uuid === productUnit)
    const unitLabel = selectedUnit
        ? selectedUnit.unit_abbreviation || selectedUnit.unit_name
        : baseLabel
    const parsedQuantity = parseWholeQuantity(quantity)
    const invalidQuantity = quantity.trim() !== "" && parsedQuantity === null
    const baseQuantity =
        selectedUnit && parsedQuantity !== null
            ? toBaseQuantity(parsedQuantity, selectedUnit.conversion_factor)
            : null
    const isLoss = movementType === "Stocktake Loss"

    const handleProductChange = (productUuid: string) => {
        setProduct(productUuid)
        // A unit only exists for its own product, so it must be re-picked.
        // Default to the new product's base unit, the one guaranteed to exist.
        const product = products.find((p) => p.uuid === productUuid)
        const baseConfig = unitsFor(productUuid).find((pu) => pu.unit === product?.base_unit)
        setProductUnit(baseConfig?.uuid ?? "")
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!product) {
            toast.error("Please select a product.")
            return
        }
        if (!productUnit) {
            toast.error("Please select the unit you counted.")
            return
        }
        if (parsedQuantity === null) {
            toast.error("Enter a whole-number quantity greater than zero.")
            return
        }

        setSubmitting(true)

        const payload: StockAdjustmentPayload = {
            product,
            product_unit: productUnit,
            movement_type: movementType,
            quantity: parsedQuantity,
            notes: notes.trim() || undefined,
        }

        try {
            await inventoryService.createStockMovement(payload)
            toast.success("Stock adjustment recorded successfully.")
            await onSuccess()
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, "Unable to record the stock adjustment."))
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
                    onValueChange={handleProductChange}
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
                <Label>Unit counted</Label>
                <Select
                    value={productUnit}
                    onValueChange={setProductUnit}
                    disabled={submitting || !product}
                >
                    <SelectTrigger>
                        <SelectValue
                            placeholder={
                                product ? "Select a unit" : "Select product first"
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {productUnits.map((pu) => (
                            <SelectItem key={pu.uuid} value={pu.uuid}>
                                {pu.unit_name}
                                {pu.unit_abbreviation
                                    ? ` (${pu.unit_abbreviation})`
                                    : ""}
                                {` · ${pu.conversion_factor} ${baseLabel}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    {selectedUnit
                        ? formatUnitConversion(selectedUnit, baseLabel)
                        : product
                          ? "Select the unit you counted"
                          : "Choose a product to load its units"}
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="adjustment-quantity">
                    Quantity ({unitLabel || "units"})
                </Label>
                <Input
                    id="adjustment-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={submitting}
                    aria-invalid={invalidQuantity}
                    placeholder="0"
                />
                {baseQuantity !== null ? (
                    <p className="text-xs text-muted-foreground">
                        {parsedQuantity} {unitLabel} = {baseQuantity} {baseLabel}{" "}
                        {isLoss ? "removed from" : "added to"} stock
                    </p>
                ) : (
                    <p
                        className={`text-xs ${
                            invalidQuantity
                                ? "text-destructive"
                                : "text-muted-foreground"
                        }`}
                    >
                        {invalidQuantity
                            ? "Whole numbers only"
                            : selectedUnit
                              ? "Enter the counted amount"
                              : "Select a unit first"}
                    </p>
                )}
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
