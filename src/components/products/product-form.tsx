"use client"

import { useEffect, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { getApiErrorMessage } from "@/lib/api-error"
import {
    inventoryService,
    type Brand,
    type Unit,
} from "@/api/services/inventory.service"
import { productService, type Product, type ProductPayload } from "@/api/services/product.service"
import type { ProductUnitPayload } from "@/api/types"

type ProductFormProps = {
    mode: "create" | "edit"
    product?: Product | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

type ProductUnitFormData = ProductUnitPayload & {
    unit_name?: string
    unit_abbreviation?: string | null
}

export function ProductForm({ mode, product, onCancel, onSubmit }: ProductFormProps) {
    const [brands, setBrands] = useState<Brand[]>([])
    const [units, setUnits] = useState<Unit[]>([])
    const [dataLoaded, setDataLoaded] = useState(false)
    const [name, setName] = useState(product?.name ?? "")
    const [brand, setBrand] = useState(product?.brand ?? "")
    const [baseUnit, setBaseUnit] = useState(product?.base_unit ?? "")
    const [buyingPrice, setBuyingPrice] = useState(product?.buying_price ?? "")
    const [sellingPrice, setSellingPrice] = useState(product?.selling_price ?? "")
    const [description, setDescription] = useState(product?.description ?? "")
    const [isActive, setIsActive] = useState(product?.is_active ?? true)
    const [productUnits, setProductUnits] = useState<ProductUnitFormData[]>(() =>
        (product?.product_units ?? [])
            .filter((pu) => pu.is_active)
            .map((pu) => ({
                unit: pu.unit,
                unit_name: pu.unit_name,
                unit_abbreviation: pu.unit_abbreviation,
                conversion_factor: String(pu.conversion_factor),
                buying_price: pu.buying_price,
                selling_price: pu.selling_price,
                is_active: pu.is_active,
            }))
    )
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
                    setUnits(unitRows.filter(u => u.is_active))
                    setDataLoaded(true)
                }
            } catch (error: unknown) {
                if (active) {
                    toast.error(getApiErrorMessage(error, "Unable to load brands or units."))
                }
            }
        }

        fetchData()
        return () => {
            active = false
        }
    }, [])

    const handleBaseUnitChange = (value: string) => {
        setBaseUnit(value)
        // Keep the base unit row present and fixed at a conversion factor of 1.
        setProductUnits((current) => {
            const existing = current.find((pu) => pu.unit === value)
            const baseRow: ProductUnitFormData = existing
                ? { ...existing, conversion_factor: "1" }
                : {
                      unit: value,
                      conversion_factor: "1",
                      buying_price: buyingPrice || "0",
                      selling_price: sellingPrice || "0",
                      is_active: true,
                  }

            if (current.length === 0) return [baseRow]
            return [
                baseRow,
                ...current.filter((pu) => pu.unit !== value && pu.unit !== baseUnit),
            ]
        })
    }

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
        if (!baseUnit) {
            setFormError("Please select a base unit.")
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

        // Conversion factors are whole numbers: how many base units one unit holds.
        const fractionalUnits = productUnits.filter(
            pu => pu.unit && !/^\d+$/.test(String(pu.conversion_factor).trim())
        )
        if (fractionalUnits.length > 0) {
            setFormError("Conversion factors must be whole numbers, for example 24.")
            return
        }

        // Validate product units
        const validUnits = productUnits.filter(pu => pu.unit && Number(pu.conversion_factor) >= 1)
        if (validUnits.length === 0) {
            setFormError("At least one product unit is required.")
            return
        }

        // A non-base unit must hold more than one base unit, otherwise it is a duplicate of the base unit.
        const redundantUnit = validUnits.find(
            pu => pu.unit !== baseUnit && Number(pu.conversion_factor) === 1
        )
        if (redundantUnit) {
            setFormError(
                "Only the base unit can have a conversion factor of 1. Every other unit must state how many base units it holds."
            )
            return
        }

        // Check base unit has conversion_factor = 1
        const baseUnitConfig = validUnits.find(pu => pu.unit === baseUnit)
        if (!baseUnitConfig) {
            setFormError("Base unit must be configured as a product unit.")
            return
        }
        if (Number(baseUnitConfig.conversion_factor) !== 1) {
            setFormError("Base unit must have conversion factor of 1.")
            return
        }

        // Check for duplicate units
        const unitIds = validUnits.map(pu => pu.unit)
        if (new Set(unitIds).size !== unitIds.length) {
            setFormError("Duplicate units are not allowed.")
            return
        }

        setSubmitting(true)

        const payload: ProductPayload = {
            name: name.trim(),
            brand,
            base_unit: baseUnit,
            buying_price: buyingPrice,
            selling_price: sellingPrice,
            description: description.trim(),
            is_active: isActive,
            product_units: validUnits.map(pu => ({
                unit: pu.unit,
                conversion_factor: pu.conversion_factor,
                buying_price: pu.buying_price,
                selling_price: pu.selling_price,
                is_active: pu.is_active ?? true,
            })),
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
        } catch (error: unknown) {
            setFormError(getApiErrorMessage(error, "Unable to save the product."))
        } finally {
            setSubmitting(false)
        }
    }

    const updateProductUnit = (index: number, field: keyof ProductUnitFormData, value: string | number | boolean) => {
        setProductUnits(prev =>
            prev.map((pu, i) =>
                i === index ? { ...pu, [field]: value } : pu
            )
        )
    }

    const addProductUnit = () => {
        const availableUnits = units.filter(
            u => !productUnits.some(pu => pu.unit === u.uuid)
        )
        if (availableUnits.length === 0) {
            toast.info("All available units are already configured.")
            return
        }
        setProductUnits([
            ...productUnits,
            {
                unit: availableUnits[0].uuid,
                conversion_factor: "1",
                buying_price: "0",
                selling_price: "0",
                is_active: true,
            }
        ])
    }

    const removeProductUnit = (index: number) => {
        const pu = productUnits[index]
        if (pu.unit === baseUnit) {
            toast.error("Cannot remove the base unit.")
            return
        }
        setProductUnits(productUnits.filter((_, i) => i !== index))
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
                    <Label>Base Unit</Label>
                    <p className="text-xs text-muted-foreground">
                        The smallest unit used for inventory calculations. All other units convert to this.
                    </p>
                    <Select
                        value={baseUnit}
                        onValueChange={handleBaseUnitChange}
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
                    <Label htmlFor="buying-price">Base Buying Price</Label>
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
                    <Label htmlFor="selling-price">Base Selling Price</Label>
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

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Product Units</Label>
                    <p className="text-xs text-muted-foreground">
                        Configure units this product can be sold/purchased in. Base unit must have conversion factor = 1.
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="grid grid-cols-[auto_auto_1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-2">
                        <span>Unit</span>
                        <span>Base units inside</span>
                        <span>Buy Price</span>
                        <span>Sell Price</span>
                        <span>Active</span>
                        <span></span>
                    </div>

                    {productUnits.map((pu, index) => (
                        <div key={index} className="grid grid-cols-[auto_auto_1fr_1fr_1fr_auto] gap-2 items-center">
                            <Select
                                value={pu.unit}
                                onValueChange={(value) => updateProductUnit(index, "unit", value)}
                                disabled={submitting || pu.unit === baseUnit}
                            >
                                <SelectTrigger className="w-full min-w-0">
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units
                                        .filter(u => !productUnits.some((p, i) => i !== index && p.unit === u.uuid))
                                        .map((u) => (
                                            <SelectItem key={u.uuid} value={u.uuid}>
                                                {u.name}{" "}
                                                {u.abbreviation && `(${u.abbreviation})`}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>

                            <Input
                                type="number"
                                step={1}
                                min={1}
                                value={pu.conversion_factor}
                                onChange={(e) => updateProductUnit(index, "conversion_factor", e.target.value)}
                                disabled={submitting || pu.unit === baseUnit}
                                className="w-24"
                                placeholder={pu.unit === baseUnit ? "1" : ""}
                            />

                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={pu.buying_price}
                                onChange={(e) => updateProductUnit(index, "buying_price", e.target.value)}
                                disabled={submitting}
                                className="w-full"
                                placeholder="0.00"
                            />

                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={pu.selling_price}
                                onChange={(e) => updateProductUnit(index, "selling_price", e.target.value)}
                                disabled={submitting}
                                className="w-full"
                                placeholder="0.00"
                            />

                            <label className="flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={pu.is_active ?? true}
                                    onChange={(e) => updateProductUnit(index, "is_active", e.target.checked)}
                                    disabled={submitting || pu.unit === baseUnit}
                                    className="size-4"
                                />
                            </label>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeProductUnit(index)}
                                disabled={submitting || pu.unit === baseUnit}
                                className="text-destructive"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addProductUnit}
                        disabled={submitting || productUnits.length >= units.length}
                    >
                        <Plus className="size-4" />
                        Add Unit
                    </Button>
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