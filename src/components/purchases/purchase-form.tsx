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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import {
    inventoryService,
    type Purchase,
    type PurchaseItem,
    type PurchaseItemPayload,
    type PurchasePayload,
    type Supplier,
} from "@/api/services/inventory.service"
import { productService, type Product as ProductType } from "@/api/services/product.service"
import { formatCurrency } from "@/lib/format"

type PurchaseFormProps = {
    mode: "create" | "edit"
    purchase?: Purchase | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

type LineItem = {
    product: string
    product_name?: string
    quantity: number
    unit_cost: string
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
                  quantity: item.quantity,
                  unit_cost: item.unit_cost,
              }))
            : [{ product: "", product_name: "", quantity: 1, unit_cost: "0.00" }]
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
            } catch {
                if (active) {
                    toast.error("Unable to load suppliers or products.")
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
        value: string | number
    ) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        )
    }

    const handleProductChange = (index: number, productUuid: string) => {
        const product = products.find((p) => p.uuid === productUuid)
        updateItem(index, "product", productUuid)
        updateItem(index, "product_name", product?.name ?? "")
        if (product) {
            updateItem(index, "unit_cost", product.buying_price)
        }
    }

    const addItem = () => {
        setItems([
            ...items,
            { product: "", product_name: "", quantity: 1, unit_cost: "0.00" },
        ])
    }

    const removeItem = (index: number) => {
        if (items.length === 1) return
        setItems(items.filter((_, i) => i !== index))
    }

    const total = useMemo(() => {
        return items.reduce((sum, item) => {
            return sum + Number(item.quantity) * Number(item.unit_cost || 0)
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
            (item) => item.product && item.quantity > 0
        )
        if (validItems.length === 0) {
            setFormError("Add at least one product with a quantity.")
            return
        }

        const productUuids = validItems.map((i) => i.product)
        if (new Set(productUuids).size !== productUuids.length) {
            setFormError("Each product can only be added once.")
            return
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
                    quantity: item.quantity,
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
        } catch (err: unknown) {
            const apiMsg =
                (err as {
                    response?: {
                        data?: {
                            detail?: string
                            items?: string[]
                            __all__?: string[]
                        }
                    }
                })?.response?.data

            setFormError(
                apiMsg?.items?.[0] ||
                    apiMsg?.__all__?.[0] ||
                    apiMsg?.detail ||
                    "Unable to save the purchase. Please review the details and try again."
            )
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
                        <Label>Supplier</Label>
                        <Select
                            value={supplier}
                            onValueChange={setSupplier}
                            disabled={submitting}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map((s) => (
                                    <SelectItem key={s.uuid} value={s.uuid}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                    <div className="overflow-x-auto rounded-md border border-border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Unit cost</TableHead>
                                    <TableHead className="text-right">
                                        Subtotal
                                    </TableHead>
                                    <TableHead className="w-12 pr-2">
                                        <span className="sr-only">Remove</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
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
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "quantity",
                                                        Math.max(
                                                            1,
                                                            parseInt(
                                                                e.target.value,
                                                                10
                                                            ) || 1
                                                        )
                                                    )
                                                }
                                                disabled={submitting}
                                                className="w-full min-w-[80px]"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_cost}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "unit_cost",
                                                        e.target.value
                                                    )
                                                }
                                                disabled={submitting}
                                                className="w-full min-w-[120px]"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(
                                                Number(item.quantity) *
                                                    Number(item.unit_cost || 0)
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(index)}
                                                disabled={
                                                    submitting || items.length === 1
                                                }
                                            >
                                                <Trash2 className="size-4 text-blue-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
