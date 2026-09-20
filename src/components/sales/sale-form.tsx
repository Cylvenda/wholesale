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
    type Customer,
    type Sale,
    type SaleItem,
    type SaleItemPayload,
    type SalePayload,
} from "@/api/services/inventory.service"
import { productService, type Product as ProductType } from "@/api/services/product.service"
import { formatCurrency } from "@/lib/format"

type SaleFormProps = {
    mode: "create" | "edit"
    sale?: Sale | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

type LineItem = {
    product: string
    product_name?: string
    quantity: number
    unit_price: string
}

export function SaleForm({ mode, sale, onCancel, onSubmit }: SaleFormProps) {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [products, setProducts] = useState<ProductType[]>([])
    const [customer, setCustomer] = useState(sale?.customer ?? "")
    const [saleDate, setSaleDate] = useState(sale?.sale_date ?? "")
    const [discount, setDiscount] = useState(sale?.discount ?? "0.00")
    const [notes, setNotes] = useState(sale?.notes ?? "")
    const [items, setItems] = useState<LineItem[]>(
        sale?.items
            ? sale.items.map((item: SaleItem) => ({
                  product: item.product,
                  product_name: item.product_name,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
              }))
            : [{ product: "", product_name: "", quantity: 1, unit_price: "0.00" }]
    )
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function fetchData() {
            try {
                const [customerRows, productRows] = await Promise.all([
                    inventoryService.listCustomers(),
                    productService.list(),
                ])
                if (active) {
                    setCustomers(customerRows.filter((c) => c.is_active))
                    setProducts(productRows)
                }
            } catch {
                if (active) {
                    toast.error("Unable to load customers or products.")
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
            updateItem(index, "unit_price", product.selling_price)
        }
    }

    const addItem = () => {
        setItems([
            ...items,
            { product: "", product_name: "", quantity: 1, unit_price: "0.00" },
        ])
    }

    const removeItem = (index: number) => {
        if (items.length === 1) return
        setItems(items.filter((_, i) => i !== index))
    }

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            return sum + Number(item.quantity) * Number(item.unit_price || 0)
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

        const payload: SalePayload = {
            customer,
            sale_date: saleDate || new Date().toISOString(),
            discount: discount,
            notes: notes.trim() || undefined,
            items: validItems.map(
                (item): SaleItemPayload => ({
                    product: item.product,
                    quantity: item.quantity,
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
                    "Unable to save the sale. Check stock levels and customer selection."
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
                        <Label>Customer</Label>
                        <Select
                            value={customer}
                            onValueChange={setCustomer}
                            disabled={submitting}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((c) => (
                                    <SelectItem key={c.uuid} value={c.uuid}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

                <div className="space-y-2">
                    <Label>Items</Label>
                    <div className="overflow-x-auto rounded-md border border-border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Unit price</TableHead>
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
                                                value={item.unit_price}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "unit_price",
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
                                                    Number(item.unit_price || 0)
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

                <div className="flex justify-end space-x-6 border-t border-border pt-4">
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
