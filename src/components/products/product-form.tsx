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
import { Switch } from "@/components/ui/switch"
import { DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import {
    productService,
    type Product,
    type ProductPayload,
} from "@/api/services/product.service"
import {
    inventoryService,
    type Brand,
    type Unit,
} from "@/api/services/inventory.service"

type ProductFormProps = {
    mode: "create" | "edit"
    product?: Product | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

export function ProductForm({ mode, product, onCancel, onSubmit }: ProductFormProps) {
    const [brands, setBrands] = useState<Brand[]>([])
    const [units, setUnits] = useState<Unit[]>([])
    const [dataLoaded, setDataLoaded] = useState(false)
    const [name, setName] = useState(product?.name ?? "")
    const [brand, setBrand] = useState(product?.brand ?? "")
    const [unit, setUnit] = useState(product?.unit ?? "")
    const [buyingPrice, setBuyingPrice] = useState(product?.buying_price ?? "")
    const [sellingPrice, setSellingPrice] = useState(product?.selling_price ?? "")
    const [description, setDescription] = useState(product?.description ?? "")
    const [isActive, setIsActive] = useState(product?.is_active ?? true)
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function fetchData() {
            try {
                const [brandRows, unitRows] = await Promise.all([
                    inventoryService.listBrands(),
                    inventoryService.listUnits(),
                ])
                if (active) {
                    setBrands(brandRows)
                    setUnits(unitRows)
                    setDataLoaded(true)
                }
            } catch {
                if (active) {
                    toast.error("Unable to load brands or units.")
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

        if (!name.trim()) {
            setFormError("Product name is required.")
            return
        }
        if (!brand) {
            setFormError("Please select a brand.")
            return
        }
        if (!unit) {
            setFormError("Please select a unit.")
            return
        }
        if (!buyingPrice) {
            setFormError("Buying price is required.")
            return
        }
        if (!sellingPrice) {
            setFormError("Selling price is required.")
            return
        }

        setSubmitting(true)

        const payload: ProductPayload = {
            name: name.trim(),
            brand,
            unit,
            buying_price: buyingPrice,
            selling_price: sellingPrice,
            description: description.trim() || undefined,
            is_active: isActive,
        }

        try {
            if (mode === "edit" && product) {
                await productService.update(product.uuid, payload)
                toast.success("Product updated successfully.")
            } else {
                await productService.create(payload)
                toast.success("Product created successfully.")
            }
            await onSubmit()
        } catch {
            setFormError(
                "Unable to save the product. Please review the details and try again."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="product-name">Product name</Label>
                <Input
                    id="product-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Brand</Label>
                    <Select
                        value={brand}
                        onValueChange={setBrand}
                        disabled={submitting || brands.length === 0}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a brand" />
                        </SelectTrigger>
                        <SelectContent>
                            {brands.map((b) => (
                                <SelectItem key={b.uuid} value={b.uuid}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                        value={unit}
                        onValueChange={setUnit}
                        disabled={submitting || !dataLoaded || units.length === 0}
                    >
                        <SelectTrigger>
                            <SelectValue
                                placeholder={
                                    !dataLoaded ? "Loading units…" : "Select a unit"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {units.map((u) => (
                                <SelectItem key={u.uuid} value={u.uuid}>
                                    {u.name}{" "}
                                    {u.abbreviation && `(${u.abbreviation})`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="buying-price">Buying price</Label>
                    <Input
                        id="buying-price"
                        type="number"
                        step="0.01"
                        value={buyingPrice}
                        onChange={(e) => setBuyingPrice(e.target.value)}
                        disabled={submitting}
                        placeholder="0.00"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="selling-price">Selling price</Label>
                    <Input
                        id="selling-price"
                        type="number"
                        step="0.01"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        disabled={submitting}
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={submitting}
                    placeholder="Optional product description"
                    rows={3}
                />
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="is-active" className="cursor-pointer">
                    Active product
                </Label>
                <Switch
                    id="is-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={submitting}
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
                            : "Creating…"
                        : mode === "edit"
                          ? "Save changes"
                          : "Create product"}
                </Button>
            </DialogFooter>
        </form>
    )
}
