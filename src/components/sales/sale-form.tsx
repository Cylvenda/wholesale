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
    type Customer,
    type CustomerPayload,
    type Sale,
    type SaleItem,
    type SaleItemPayload,
    type SalePayload,
    type Stock,
} from "@/api/services/inventory.service"
import { productService, type Product as ProductType } from "@/api/services/product.service"
import type { ProductUnit } from "@/api/types"
import { formatCurrency } from "@/lib/format"
import {
    formatAvailableInSelectedUnit,
    formatBaseStock,
    formatQuantityConversion,
    formatUnitConversion,
    parseWholeQuantity,
    toBaseQuantity,
} from "@/lib/product-units"

type SaleFormProps = {
    mode: "create" | "edit"
    sale?: Sale | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

type LineItem = {
    product: string
    product_name?: string
    product_unit: string
    product_unit_name?: string
    /** Kept as text so an invalid entry such as "1.5" can be shown and rejected. */
    quantity: string
    unit_price: string
}

const EMPTY_ITEM: LineItem = {
    product: "",
    product_name: "",
    product_unit: "",
    product_unit_name: "",
    quantity: "1",
    unit_price: "0.00",
}

export function SaleForm({ mode, sale, onCancel, onSubmit }: SaleFormProps) {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [products, setProducts] = useState<ProductType[]>([])
    const [stockRows, setStockRows] = useState<Stock[]>([])
    const [customer, setCustomer] = useState(sale?.customer ?? "")
    const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing")
    const [newCustomerName, setNewCustomerName] = useState("")
    const [newCustomerEmail, setNewCustomerEmail] = useState("")
    const [newCustomerPhone, setNewCustomerPhone] = useState("")
    const [creatingCustomer, setCreatingCustomer] = useState(false)
    const [saleDate, setSaleDate] = useState(sale?.sale_date ?? "")
    const [discount, setDiscount] = useState(sale?.discount ?? "0.00")
    const [notes, setNotes] = useState(sale?.notes ?? "")
    const [items, setItems] = useState<LineItem[]>(
        sale?.items
            ? sale.items.map((item: SaleItem) => ({
                product: item.product,
                product_name: item.product_name,
                product_unit: item.product_unit,
                product_unit_name: item.product_unit_name,
                quantity: String(item.quantity),
                unit_price: item.unit_price,
            }))
            : [{ ...EMPTY_ITEM }]
    )
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function fetchData() {
            try {
                const [customerRows, productRows, stockData] = await Promise.all([
                    inventoryService.listCustomers(),
                    productService.list(),
                    inventoryService.listStock(),
                ])
                if (active) {
                    setCustomers(customerRows.filter((c) => c.is_active))
                    setProducts(productRows)
                    setStockRows(stockData)
                }
            } catch (error: unknown) {
                if (active) {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Unable to load customers or products."
                        )
                    )
                }
            }
        }

        fetchData()
        return () => {
            active = false
        }
    }, [])

    const updateItem = (index: number, field: keyof LineItem, value: string) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        )
    }

    const productFor = (productUuid: string) =>
        products.find((candidate) => candidate.uuid === productUuid)

    /** Only the units configured for this product, never the global unit list. */
    const unitsFor = (productUuid: string): ProductUnit[] => {
        const product = productFor(productUuid)
        if (!product) return []
        return (product.product_units ?? [])
            .filter((pu) => pu.is_active)
            .sort((a, b) => a.conversion_factor - b.conversion_factor)
    }

    const unitFor = (productUuid: string, productUnitUuid: string) =>
        unitsFor(productUuid).find((pu) => pu.uuid === productUnitUuid)

    const baseUnitLabel = (product: ProductType) =>
        product.base_unit_abbreviation || product.base_unit_name

    /**
     * Stock already on hand in base units, plus whatever this sale currently
     * holds for the product (relevant while editing an existing sale).
     */
    const availableStockFor = (productUuid: string) => {
        const currentStock = Number(
            stockRows.find((row) => row.product === productUuid)?.quantity ?? 0
        )
        const heldBySale =
            sale?.items
                .filter((saleItem) => saleItem.product === productUuid)
                .reduce((total, saleItem) => total + Number(saleItem.base_quantity ?? 0), 0) ?? 0
        return currentStock + heldBySale
    }

    const lineAvailability = (item: LineItem) => {
        const product = productFor(item.product)
        const productUnit = unitFor(item.product, item.product_unit)
        if (!product || !productUnit) return null

        const baseStock = availableStockFor(item.product)
        const baseLabel = baseUnitLabel(product)
        const unitLabel = productUnit.unit_abbreviation || productUnit.unit_name
        const factor = productUnit.conversion_factor

        const maxQuantity = Math.floor(baseStock / factor)
        const quantity = parseWholeQuantity(item.quantity)
        const baseQuantity = quantity ? toBaseQuantity(quantity, factor) : null

        return {
            product,
            productUnit,
            baseStock,
            baseLabel,
            unitLabel,
            maxQuantity,
            remainingBaseStock: baseQuantity === null ? null : baseStock - baseQuantity,
            overLimit: quantity !== null && quantity > maxQuantity,
            availableDisplay: formatAvailableInSelectedUnit(
                baseStock,
                factor,
                unitLabel,
                baseLabel
            ),
            baseDisplay: formatBaseStock(baseStock, baseLabel),
            quantity,
            baseQuantity,
        }
    }

    const handleProductChange = (index: number, productUuid: string) => {
        const product = productFor(productUuid)
        const units = (product?.product_units ?? []).filter((pu) => pu.is_active)
        const baseConfig = units.find((pu) => pu.unit === product?.base_unit)

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
                        unit_price: baseConfig?.selling_price ?? "0.00",
                    }
                    : item
            )
        )
    }

    /**
     * Switching unit immediately re-prices the line and keeps the entered
     * quantity inside the new unit's limit.
     */
    const handleProductUnitChange = (index: number, productUnitUuid: string) => {
        const item = items[index]
        const productUnit = unitFor(item.product, productUnitUuid)
        if (!productUnit) return

        const product = productFor(item.product)
        const baseStock = product ? availableStockFor(product.uuid) : 0
        const maxQuantity = Math.floor(baseStock / productUnit.conversion_factor)
        const entered = parseWholeQuantity(item.quantity)

        setItems((prev) =>
            prev.map((row, i) =>
                i === index
                    ? {
                        ...row,
                        product_unit: productUnitUuid,
                        product_unit_name: productUnit.unit_name,
                        unit_price: productUnit.selling_price,
                        quantity: entered === null ? row.quantity : String(Math.max(1, Math.min(entered, maxQuantity))),
                    }
                    : row
            )
        )
    }

    const handleCreateCustomer = async () => {
        const name = newCustomerName.trim()
        const email = newCustomerEmail.trim()
        const phone = newCustomerPhone.trim()
        if (!name || !email || !phone) {
            toast.error("Enter the customer's full name, email, and phone number.")
            return
        }

        setCreatingCustomer(true)
        const payload: CustomerPayload = {
            name,
            email,
            phone,
            business_location: "",
            is_active: true,
        }
        try {
            const created = await inventoryService.createCustomer(payload)
            setCustomers((current) => [created, ...current])
            setCustomer(created.uuid)
            setCustomerMode("existing")
            setNewCustomerName("")
            setNewCustomerEmail("")
            setNewCustomerPhone("")
            toast.success("Customer created and selected.")
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, "Unable to create the customer."))
        } finally {
            setCreatingCustomer(false)
        }
    }

    const addItem = () => {
        setItems((current) => [...current, { ...EMPTY_ITEM }])
    }

    const removeItem = (index: number) => {
        if (items.length === 1) return
        setItems((prev) => prev.filter((_, i) => i !== index))
    }

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const quantity = parseWholeQuantity(item.quantity)
            return sum + (quantity ?? 0) * Number(item.unit_price || 0)
        }, 0)
    }, [items])

    const total = subtotal - Number(discount || 0)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError(null)

        if (!customer) {
            setFormError("Please select a customer.")
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

        for (const item of validItems) {
            const info = lineAvailability(item)
            if (!info) {
                setFormError(`Select a valid unit for ${item.product_name}.`)
                return
            }

            const quantity = parseWholeQuantity(item.quantity)
            if (quantity === null) {
                setFormError(
                    `Quantity for ${item.product_name} must be a whole number (no 1.5).`
                )
                return
            }

            if (quantity > info.maxQuantity) {
                setFormError(
                    `Insufficient stock for ${item.product_name}. Only ${info.maxQuantity} ${info.unitLabel} are available (${info.baseDisplay} total).`
                )
                return
            }
        }

        if (Number(discount || 0) > subtotal) {
            setFormError("Discount cannot exceed the sale subtotal.")
            return
        }

        setSubmitting(true)

        const payload: SalePayload = {
            customer,
            sale_date: saleDate || new Date().toISOString(),
            discount: discount,
            notes: notes.trim() || undefined,
            items: validItems.map(
                (item): SaleItemPayload => ({
                    product: item.product,
                    product_unit: item.product_unit,
                    quantity: parseWholeQuantity(item.quantity) as number,
                    unit_price: item.unit_price,
                })
            ),
        }

        try {
            if (mode === "edit" && sale) {
                await inventoryService.updateSale(sale.uuid, payload)
                toast.success("Sale updated successfully.")
            } else {
                await inventoryService.createSale(payload)
                toast.success("Sale recorded successfully.")
            }
            await onSubmit()
        } catch (error: unknown) {
            setFormError(getApiErrorMessage(error, "Unable to save the sale."))
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
                            <Label>Customer</Label>
                            <div className="flex gap-1">
                                <Button type="button" size="sm" variant={customerMode === "existing" ? "default" : "outline"} onClick={() => setCustomerMode("existing")} disabled={submitting}>Existing</Button>
                                <Button type="button" size="sm" variant={customerMode === "new" ? "default" : "outline"} onClick={() => setCustomerMode("new")} disabled={submitting}>New</Button>
                            </div>
                        </div>
                        {customerMode === "existing" ? (
                            <Select value={customer} onValueChange={setCustomer} disabled={submitting}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select a customer" /></SelectTrigger>
                                <SelectContent>
                                    {customers.map((entry) => <SelectItem key={entry.uuid} value={entry.uuid}>{entry.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-3">
                                <Input aria-label="Customer full name" placeholder="Full name" value={newCustomerName} onChange={(event) => setNewCustomerName(event.target.value)} disabled={creatingCustomer || submitting} />
                                <Input aria-label="Customer email" type="email" placeholder="Email" value={newCustomerEmail} onChange={(event) => setNewCustomerEmail(event.target.value)} disabled={creatingCustomer || submitting} />
                                <Input aria-label="Customer phone" type="tel" placeholder="Phone" value={newCustomerPhone} onChange={(event) => setNewCustomerPhone(event.target.value)} disabled={creatingCustomer || submitting} />
                                <Button type="button" className="sm:col-span-3 sm:justify-self-end" onClick={handleCreateCustomer} disabled={creatingCustomer || submitting}>
                                    {creatingCustomer ? "Adding customer…" : "Add and select customer"}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sale-date">Sale date</Label>
                        <Input
                            id="sale-date"
                            type="datetime-local"
                            value={saleDate}
                            onChange={(e) => setSaleDate(e.target.value)}
                            disabled={submitting}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="discount">Discount</Label>
                        <Input
                            id="discount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={discount}
                            onChange={(e) =>
                                setDiscount(
                                    Math.max(0, Number(e.target.value) || 0).toString()
                                )
                            }
                            disabled={submitting}
                            placeholder="0.00"
                        />
                    </div>
                    <div />
                </div>

                <div className="space-y-3">
                    <Label>Items</Label>
                    <div className="space-y-4">
                        {items.map((item, index) => {
                            const info = lineAvailability(item)
                            const compatibleUnits = unitsFor(item.product)
                            const selectedUnit = info?.productUnit
                            const baseLabel = info?.baseLabel ?? ""

                            return (
                                <div
                                    key={index}
                                    className="rounded-md border border-border bg-card p-3 sm:p-4"
                                >
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                                        <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                                            <Label className="text-xs text-muted-foreground">
                                                Product
                                            </Label>
                                            <Select
                                                value={item.product}
                                                onValueChange={(v) =>
                                                    handleProductChange(index, v)
                                                }
                                                disabled={submitting}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a product" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products
                                                        .filter(
                                                            (p) =>
                                                                p.uuid ===
                                                                item.product ||
                                                                !selectedProductUuids.has(
                                                                    p.uuid
                                                                )
                                                        )
                                                        .map((p) => (
                                                            <SelectItem
                                                                key={p.uuid}
                                                                value={p.uuid}
                                                            >
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                                            <Label className="text-xs text-muted-foreground">
                                                Selling Unit
                                            </Label>
                                            <Select
                                                value={item.product_unit}
                                                onValueChange={(value) => handleProductUnitChange(index, value)}
                                                disabled={submitting || !item.product}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {compatibleUnits.map((pu) => (
                                                        <SelectItem key={pu.uuid} value={pu.uuid}>
                                                            {pu.unit_name}
                                                            {pu.unit_abbreviation ? ` (${pu.unit_abbreviation})` : ""}
                                                            {` · ${pu.conversion_factor} ${baseLabel}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedUnit
                                                    ? formatUnitConversion(
                                                        selectedUnit,
                                                        info?.baseLabel ?? ""
                                                    )
                                                    : "Select a unit"}
                                            </p>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Available
                                            </Label>
                                            <p
                                                className={`text-sm font-medium leading-6 ${
                                                    info && info.maxQuantity === 0
                                                        ? "text-destructive"
                                                        : "text-foreground"
                                                }`}
                                            >
                                                {info ? info.availableDisplay : "—"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {info
                                                    ? `Max ${info.maxQuantity} ${info.unitLabel} · ${info.baseDisplay} total`
                                                    : "Select a product"}
                                            </p>
                                        </div>

                                        <div className="col-span-1 space-y-1">
                                            <Label
                                                className="text-xs text-muted-foreground"
                                                htmlFor={`quantity-${index}`}
                                            >
                                                Quantity
                                            </Label>
                                            <Input
                                                id={`quantity-${index}`}
                                                type="number"
                                                step={1}
                                                min={1}
                                                max={info && info.maxQuantity > 0 ? info.maxQuantity : undefined}
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateItem(index, "quantity", e.target.value)
                                                }
                                                disabled={submitting}
                                                className="w-full"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {info && info.quantity !== null
                                                    ? formatQuantityConversion(
                                                        info.quantity,
                                                        info.productUnit.conversion_factor,
                                                        info.unitLabel,
                                                        info.baseLabel
                                                    )
                                                    : "Whole numbers only"}
                                            </p>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <Label
                                                className="text-xs text-muted-foreground"
                                                htmlFor={`unit-price-${index}`}
                                            >
                                                Unit Price
                                            </Label>
                                            <Input
                                                id={`unit-price-${index}`}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) =>
                                                    updateItem(index, "unit_price", e.target.value)
                                                }
                                                disabled={submitting}
                                                className="w-full"
                                            />
                                        </div>

                                        <div className="col-span-1 space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Subtotal
                                            </Label>
                                            <p className="text-sm font-semibold leading-6">
                                                {formatCurrency(
                                                    (info?.quantity ?? 0) *
                                                    Number(item.unit_price || 0)
                                                )}
                                            </p>
                                        </div>

                                        <div className="col-span-1 flex items-end justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeItem(index)}
                                                disabled={submitting || items.length === 1}
                                                aria-label={`Remove ${item.product_name || "item"}`}
                                            >
                                                <Trash2 className="size-4 text-blue-600" />
                                            </Button>
                                        </div>
                                    </div>

                                    {info && (
                                        <p
                                            className={`mt-2 text-xs ${
                                                info.overLimit
                                                    ? "font-medium text-destructive"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {info.overLimit
                                                ? `Only ${info.maxQuantity} ${info.unitLabel} available (${info.baseDisplay} total).`
                                                : info.remainingBaseStock !== null
                                                  ? `After sale: ${formatAvailableInSelectedUnit(
                                                        info.remainingBaseStock,
                                                        info.productUnit.conversion_factor,
                                                        info.unitLabel,
                                                        info.baseLabel
                                                    )} · ${info.baseDisplay} before`
                                                  : ""}
                                        </p>
                                    )}
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

                <div className="flex flex-wrap justify-end gap-6 border-t border-border pt-4">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Subtotal</p>
                        <p className="text-lg font-semibold">
                            {formatCurrency(subtotal)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Discount</p>
                        <p className="text-lg font-semibold">
                            -{formatCurrency(Number(discount || 0))}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-chart-3">
                            {formatCurrency(total)}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sale-notes">Notes</Label>
                    <Textarea
                        id="sale-notes"
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
                            : "Record sale"}
                </Button>
            </DialogFooter>
        </form>
    )
}