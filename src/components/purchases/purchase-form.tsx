"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
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
    type Purchase,
    type PurchaseItem,
    type PurchaseItemPayload,
    type PurchasePayload,
    type Supplier,
    type SupplierPayload,
    type ProductUnit,
} from "@/api/services/inventory.service"
import { productService, type Product as ProductType } from "@/api/services/product.service"
import { formatCurrency } from "@/lib/format"
import {
    formatUnitConversion,
    parseWholeQuantity,
    toBaseQuantity,
} from "@/lib/product-units"

type PurchaseFormProps = {
    mode: "create" | "edit"
    purchase?: Purchase | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

type LineItem = {
    product: string
    product_name?: string
    product_unit: string
    product_unit_name?: string
    quantity: string
    unit_cost: string
}

/**
 * One height for every control in an item row. The base Input and SelectTrigger
 * default to `h-8`, which is too shallow next to a `type="number"` spinner, so
 * each row control is pinned to the same 40px box.
 */
const ROW_CONTROL = "h-10 w-full"

type ItemFieldProps = {
    label: string
    htmlFor?: string
    className?: string
    /** Read-only cell content, for columns like Conversion and Subtotal. */
    value?: string
    helper?: string
    tone?: "muted" | "error"
    children?: React.ReactNode
}

/**
 * A single cell of a purchase item row.
 *
 * The label sits above the control and the helper line is reserved at a fixed
 * height below it, so a field that has helper text never pushes its control out
 * of line with the controls beside it.
 */
function ItemField({
    label,
    htmlFor,
    className,
    value,
    helper,
    tone = "muted",
    children,
}: ItemFieldProps) {
    return (
        <div className={`flex min-w-0 flex-col ${className ?? ""}`}>
            <Label
                htmlFor={htmlFor}
                className="mb-1 text-xs font-medium text-muted-foreground"
            >
                {label}
            </Label>
            {children ?? (
                <span className="flex h-10 items-center truncate text-sm font-medium">
                    {value}
                </span>
            )}
            <span
                aria-hidden={!helper}
                className={`mt-1 line-clamp-1 min-h-4 text-xs leading-4 ${
                    tone === "error" ? "text-destructive" : "text-muted-foreground"
                }`}
            >
                {helper ?? "\u00a0"}
            </span>
        </div>
    )
}

export function PurchaseForm({
    mode,
    purchase,
    onCancel,
    onSubmit,
}: PurchaseFormProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [products, setProducts] = useState<ProductType[]>([])
    const [supplier, setSupplier] = useState(purchase?.supplier ?? "")
    const [supplierMode, setSupplierMode] = useState<"existing" | "new">("existing")
    const [newSupplierName, setNewSupplierName] = useState("")
    const [newSupplierEmail, setNewSupplierEmail] = useState("")
    const [newSupplierPhone, setNewSupplierPhone] = useState("")
    const [creatingSupplier, setCreatingSupplier] = useState(false)
    const [invoiceNumber, setInvoiceNumber] = useState(
        purchase?.invoice_number ?? ""
    )
    const [purchaseDate, setPurchaseDate] = useState(
        purchase?.purchase_date ?? ""
    )
    const [notes, setNotes] = useState(purchase?.notes ?? "")
    const [items, setItems] = useState<LineItem[]>(
        purchase?.items
            ? purchase.items.map((item: PurchaseItem) => ({
                product: item.product,
                product_name: item.product_name,
                product_unit: item.product_unit,
                product_unit_name: item.product_unit_name,
                quantity: String(item.quantity),
                unit_cost: item.unit_cost,
            }))
            : [{ product: "", product_name: "", product_unit: "", product_unit_name: "", quantity: "1", unit_cost: "0.00" }]
    )
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        async function fetchData() {
            try {
                const [supplierRows, productRows] = await Promise.all([
                    inventoryService.listSuppliers(),
                    productService.list(),
                ])
                if (active) {
                    setSuppliers(supplierRows.filter((s) => s.is_active))
                    setProducts(productRows)
                }
            } catch (error: unknown) {
                if (active) {
                    toast.error(getApiErrorMessage(error, "Unable to load suppliers or products."))
                }
            }
        }
        fetchData()
        return () => {
            active = false
        }
    }, [])

    const updateItem = (
        index: number,
        field: keyof LineItem,
        value: string
    ) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        )
    }

    /**
     * Changing the product invalidates the previous unit: a crate configured for
     * product A is not necessarily configured for product B. The line falls back
     * to the new product's base unit, which is the only unit guaranteed to exist.
     */
    const handleProductChange = (index: number, productUuid: string) => {
        const product = products.find((p) => p.uuid === productUuid)
        const baseConfig = unitsFor(productUuid).find((pu) => pu.unit === product?.base_unit)
        setItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        product: productUuid,
                        product_name: product?.name ?? "",
                        product_unit: baseConfig?.uuid ?? "",
                        product_unit_name: baseConfig?.unit_name ?? "",
                        quantity: "1",
                        unit_cost: baseConfig?.buying_price ?? "0.00",
                    }
                    : item
            )
        )
    }

    /**
     * Switching unit re-prices the line from that ProductUnit's own buying_price.
     * A crate price is never derived from a bottle price - the business may buy a
     * crate at any price, so the configured value is used as-is.
     */
    const handleProductUnitChange = (index: number, productUnitUuid: string) => {
        const item = items[index]
        const productUnit = unitFor(item.product, productUnitUuid)
        if (!productUnit) return
        setItems((prev) =>
            prev.map((row, i) =>
                i === index
                    ? {
                        ...row,
                        product_unit: productUnitUuid,
                        product_unit_name: productUnit.unit_name,
                        // The buying price of the unit actually being purchased.
                        unit_cost: productUnit.buying_price,
                    }
                    : row
            )
        )
    }

    const handleCreateSupplier = async () => {
        const name = newSupplierName.trim()
        const email = newSupplierEmail.trim()
        const phone = newSupplierPhone.trim()
        if (!name || !email || !phone) {
            toast.error("Enter the supplier's full name, email, and phone number.")
            return
        }

        setCreatingSupplier(true)
        const payload: SupplierPayload = { name, email, phone, address: "", is_active: true }
        try {
            const created = await inventoryService.createSupplier(payload)
            setSuppliers((current) => [created, ...current])
            setSupplier(created.uuid)
            setSupplierMode("existing")
            setNewSupplierName("")
            setNewSupplierEmail("")
            setNewSupplierPhone("")
            toast.success("Supplier created and selected.")
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, "Unable to create the supplier."))
        } finally {
            setCreatingSupplier(false)
        }
    }

    /**
     * The purchase unit dropdown lists ONLY the ProductUnits configured for the
     * chosen product - the same rows the product form saved and sales uses.
     * There is no free-typed unit and no global unit list.
     */
    const unitsFor = (productUuid: string): ProductUnit[] => {
        if (!productUuid) return []
        return products
            .find((p) => p.uuid === productUuid)
            ?.product_units?.filter((pu) => pu.is_active) ?? []
    }

    const unitFor = (productUuid: string, productUnitUuid: string) =>
        unitsFor(productUuid).find((pu) => pu.uuid === productUnitUuid)

    const baseLabelFor = (productUuid: string) => {
        const product = products.find((p) => p.uuid === productUuid)
        return product?.base_unit_abbreviation || product?.base_unit_name || ""
    }

    const addItem = () => {
        setItems((current) => [
            ...current,
            { product: "", product_name: "", product_unit: "", product_unit_name: "", quantity: "1", unit_cost: "0.00" },
        ])
    }

    const removeItem = (index: number) => {
        if (items.length === 1) return
        setItems((prev) => prev.filter((_, i) => i !== index))
    }

    const total = useMemo(() => {
        return items.reduce((sum, item) => {
            const quantity = parseWholeQuantity(item.quantity) ?? 0
            return sum + quantity * Number(item.unit_cost || 0)
        }, 0)
    }, [items])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError(null)

        if (!supplier) {
            setFormError("Please select a supplier.")
            return
        }

        const validItems = items.filter(
            (item) => item.product && item.product_unit && parseWholeQuantity(item.quantity)
        )
        if (validItems.length === 0) {
            setFormError("Add at least one product with a unit and a whole quantity.")
            return
        }

        const productUuids = validItems.map((i) => i.product)
        if (new Set(productUuids).size !== productUuids.length) {
            setFormError("Each product can only be added once.")
            return
        }

        // Purchases are whole units too: 10 crates of 24 adds 240 base units.
        for (const item of validItems) {
            const productUnit = unitFor(item.product, item.product_unit)
            if (!productUnit) {
                setFormError(`Select a valid unit for ${item.product_name}.`)
                return
            }
            if (parseWholeQuantity(item.quantity) === null) {
                setFormError(
                    `Quantity for ${item.product_name} must be a whole number (no 1.5).`
                )
                return
            }
        }

        setSubmitting(true)

        const payload: PurchasePayload = {
            supplier,
            invoice_number: invoiceNumber.trim() || undefined,
            purchase_date: purchaseDate || new Date().toISOString(),
            notes: notes.trim() || undefined,
            items: validItems.map(
                (item): PurchaseItemPayload => ({
                    product: item.product,
                    product_unit: item.product_unit,
                    quantity: parseWholeQuantity(item.quantity) as number,
                    unit_cost: item.unit_cost,
                })
            ),
        }

        try {
            if (mode === "edit" && purchase) {
                await inventoryService.updatePurchase(purchase.uuid, payload)
                toast.success("Purchase updated successfully.")
            } else {
                await inventoryService.createPurchase(payload)
                toast.success("Purchase recorded successfully.")
            }
            await onSubmit()
        } catch (error: unknown) {
            setFormError(getApiErrorMessage(error, "Unable to save the purchase."))
        } finally {
            setSubmitting(false)
        }
    }

    const selectedProductUuids = new Set(
        items.map((i) => i.product).filter(Boolean)
    )

    return (
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-6">
            <div className="flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <Label>Supplier</Label>
                            <div className="flex gap-1">
                                <Button type="button" size="sm" variant={supplierMode === "existing" ? "default" : "outline"} onClick={() => setSupplierMode("existing")} disabled={submitting}>Existing</Button>
                                <Button type="button" size="sm" variant={supplierMode === "new" ? "default" : "outline"} onClick={() => setSupplierMode("new")} disabled={submitting}>New</Button>
                            </div>
                        </div>
                        {supplierMode === "existing" ? (
                            <Select value={supplier} onValueChange={setSupplier} disabled={submitting}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select a supplier" /></SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((entry) => <SelectItem key={entry.uuid} value={entry.uuid}>{entry.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-3">
                                <Input aria-label="Supplier full name" placeholder="Full name" value={newSupplierName} onChange={(event) => setNewSupplierName(event.target.value)} disabled={creatingSupplier || submitting} />
                                <Input aria-label="Supplier email" type="email" placeholder="Email" value={newSupplierEmail} onChange={(event) => setNewSupplierEmail(event.target.value)} disabled={creatingSupplier || submitting} />
                                <Input aria-label="Supplier phone" type="tel" placeholder="Phone" value={newSupplierPhone} onChange={(event) => setNewSupplierPhone(event.target.value)} disabled={creatingSupplier || submitting} />
                                <Button type="button" className="sm:col-span-3 sm:justify-self-end" onClick={handleCreateSupplier} disabled={creatingSupplier || submitting}>
                                    {creatingSupplier ? "Adding supplier…" : "Add and select supplier"}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="invoice-number">Invoice number</Label>
                        <Input
                            id="invoice-number"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            disabled={submitting}
                            placeholder="Optional"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purchase-date">Purchase date</Label>
                    <Input
                        id="purchase-date"
                        type="datetime-local"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        disabled={submitting}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Items</Label>
                    <div className="space-y-3">
                        {items.map((item, index) => {
                            const productUnits = unitsFor(item.product)
                            const selectedUnit = productUnits.find(
                                (pu) => pu.uuid === item.product_unit
                            )
                            const baseLabel = baseLabelFor(item.product)
                            const unitLabel = selectedUnit
                                ? selectedUnit.unit_abbreviation || selectedUnit.unit_name
                                : baseLabel
                            const enteredQuantity = parseWholeQuantity(item.quantity)
                            const factor = selectedUnit?.conversion_factor ?? 1
                            const baseQuantity =
                                selectedUnit && enteredQuantity !== null
                                    ? toBaseQuantity(enteredQuantity, factor)
                                    : null
                            const conversionText =
                                enteredQuantity !== null && baseQuantity !== null
                                    ? `${enteredQuantity} ${unitLabel} → ${baseQuantity} ${baseLabel}`
                                    : null
                            const invalidQuantity =
                                item.quantity.trim() !== "" && enteredQuantity === null
                            const subtotal =
                                (enteredQuantity ?? 0) * Number(item.unit_cost || 0)

                            return (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 gap-x-3 gap-y-2 rounded-md border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-12"
                                >
                                    <ItemField
                                        label="Product"
                                        className="sm:col-span-2 lg:col-span-3"
                                        helper={baseLabel ? `Priced per ${baseLabel}` : "Select a product"}
                                    >
                                        <Select
                                            value={item.product}
                                            onValueChange={(v) => handleProductChange(index, v)}
                                            disabled={submitting}
                                        >
                                            <SelectTrigger className={ROW_CONTROL}>
                                                <SelectValue placeholder="Select a product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products
                                                    .filter(
                                                        (p) =>
                                                            p.uuid === item.product ||
                                                            !selectedProductUuids.has(p.uuid)
                                                    )
                                                    .map((p) => (
                                                        <SelectItem key={p.uuid} value={p.uuid}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </ItemField>

                                    <ItemField
                                        label="Purchase Unit"
                                        className="lg:col-span-2"
                                        helper={
                                            selectedUnit
                                                ? formatUnitConversion(selectedUnit, baseLabel)
                                                : item.product
                                                  ? "Select unit"
                                                  : "Choose a product to load its units"
                                        }
                                    >
                                        <Select
                                            value={item.product_unit}
                                            onValueChange={(value) => handleProductUnitChange(index, value)}
                                            disabled={submitting || !item.product}
                                        >
                                            <SelectTrigger className={ROW_CONTROL}>
                                                <SelectValue
                                                    placeholder={
                                                        item.product ? "Select unit" : "Select product first"
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {productUnits.map((pu) => (
                                                    <SelectItem key={pu.uuid} value={pu.uuid}>
                                                        {pu.unit_name}
                                                        {pu.unit_abbreviation ? ` (${pu.unit_abbreviation})` : ""}
                                                        {` · ${pu.conversion_factor} ${baseLabel}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </ItemField>

                                    <ItemField
                                        label="Quantity"
                                        className="lg:col-span-1"
                                        htmlFor={`purchase-quantity-${index}`}
                                        tone={invalidQuantity ? "error" : "muted"}
                                        helper={
                                            invalidQuantity
                                                ? "Whole numbers only"
                                                : selectedUnit
                                                  ? `of ${unitLabel}`
                                                  : "Select a unit first"
                                        }
                                    >
                                        <Input
                                            id={`purchase-quantity-${index}`}
                                            type="number"
                                            step={1}
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                            disabled={submitting}
                                            aria-invalid={invalidQuantity}
                                            className={ROW_CONTROL}
                                        />
                                    </ItemField>

                                    <ItemField
                                        label="Conversion"
                                        className="lg:col-span-2"
                                        value={conversionText ?? "\u2014"}
                                        helper={
                                            baseQuantity !== null
                                                ? `Adds +${baseQuantity} ${baseLabel} to stock`
                                                : "Select a unit"
                                        }
                                    />

                                    <ItemField
                                        label="Unit Cost"
                                        className="lg:col-span-2"
                                        htmlFor={`purchase-unit-cost-${index}`}
                                        helper={selectedUnit ? `Per ${unitLabel}` : "Select a unit first"}
                                    >
                                        <Input
                                            id={`purchase-unit-cost-${index}`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.unit_cost}
                                            onChange={(e) => updateItem(index, "unit_cost", e.target.value)}
                                            disabled={submitting}
                                            className={ROW_CONTROL}
                                        />
                                    </ItemField>

                                    <div className="flex flex-col lg:col-span-1">
                                        <span className="mb-1 text-xs font-medium text-muted-foreground">
                                            Subtotal
                                        </span>
                                        <span className="flex h-10 items-center text-sm font-semibold tabular-nums">
                                            {formatCurrency(subtotal)}
                                        </span>
                                        <span aria-hidden className="mt-1 min-h-4" />
                                    </div>

                                    <div className="flex flex-col lg:col-span-1 lg:items-end">
                                        <span aria-hidden className="mb-1 h-4" />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(index)}
                                            disabled={submitting || items.length === 1}
                                            aria-label={`Remove item ${index + 1}`}
                                            className="size-10 text-blue-600 hover:text-blue-700"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                        <span aria-hidden className="mt-1 min-h-4" />
                                    </div>
                            </div>
                            )
                        })}
                    </div>


                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addItem}
                        disabled={submitting}
                    >
                        <Plus className="size-4 text-blue-600" />
                        Add item
                    </Button>
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-chart-3">
                            {formatCurrency(total)}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purchase-notes">Notes</Label>
                    <Textarea
                        id="purchase-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={submitting}
                        placeholder="Optional notes"
                        rows={3}
                    />
                </div>
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
                            : "Record purchase"}
                </Button>
            </DialogFooter>
        </form>
    )
}