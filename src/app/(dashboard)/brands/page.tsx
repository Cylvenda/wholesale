"use client"

import { useCallback, useState } from "react"
import { toast } from "react-toastify"
import {
    inventoryService,
    type Brand,
    type Category,
} from "@/api/services/inventory.service"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DialogFooter as FormDialogFooter } from "@/components/ui/dialog"
import { ResourcePage } from "@/components/resource-page"
import type { InventoryRow } from "@/lib/inventory-data"
import { formatDate } from "@/lib/format"

function messageFrom(error: unknown, fallback: string) {
    if (typeof error === "object" && error && "response" in error) {
        const response = error.response as {
            data?: { detail?: string }
        }
        return response.data?.detail ?? fallback
    }
    return fallback
}

function toRows(brands: Brand[]): InventoryRow[] {
    return brands.map((brand) => ({
        id: brand.uuid,
        primary: brand.name,
        secondary: brand.category_name || undefined,
        values: [formatDate(brand.created_at)],
    }))
}

export default function BrandsPage() {
    const [formOpen, setFormOpen] = useState(false)
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
    const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)
    const [values, setValues] = useState<{
        name: string
        category: string
    }>({ name: "", category: "" })
    const [categories, setCategories] = useState<Category[]>([])
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const loadRows = useCallback(async () => {
        const [brandRows, categoryRows] = await Promise.all([
            inventoryService.listBrands(),
            inventoryService.listCategories(),
        ])
        setCategories(categoryRows)
        return toRows(brandRows)
    }, [])

    const openCreate = () => {
        setEditingBrand(null)
        setValues({ name: "", category: "" })
        setFormError(null)
        setFormOpen(true)
    }

    const openEdit = (brand: Brand) => {
        setEditingBrand(brand)
        setValues({ name: brand.name, category: brand.category })
        setFormError(null)
        setFormOpen(true)
    }

    const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!values.name.trim() || !values.category) {
            setFormError("Brand name and category are required.")
            return
        }

        setSubmitting(true)
        setFormError(null)
        try {
            if (editingBrand) {
                await inventoryService.updateBrand(editingBrand.uuid, {
                    ...values,
                    name: values.name.trim(),
                })
                toast.success("Brand updated successfully.")
            } else {
                await inventoryService.createBrand({
                    ...values,
                    name: values.name.trim(),
                })
                toast.success("Brand created successfully.")
            }
            setFormOpen(false)
        } catch (submitError) {
            setFormError(
                messageFrom(
                    submitError,
                    "Unable to save the brand. Please review the details and try again."
                )
            )
        } finally {
            setSubmitting(false)
        }
    }

    const deleteBrand = async () => {
        if (!deletingBrand) return
        setSubmitting(true)
        try {
            await inventoryService.deleteBrand(deletingBrand.uuid)
            toast.success("Brand deleted successfully.")
            setDeletingBrand(null)
        } catch (deleteError) {
            toast.error(
                messageFrom(
                    deleteError,
                    "Unable to delete this brand. It may be in use by products."
                )
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <ResourcePage
                title="Brands"
                description="Manage beverage brands and their product categories."
                action="Add brand"
                columns={["Brand", "Created"]}
                loadRows={loadRows}
                onAction={openCreate}
                onEdit={(row) => {
                    const brand: Brand = {
                        uuid: row.id,
                        name: row.primary,
                        category: "",
                        category_name: row.secondary ?? "",
                        created_at: "",
                        created_by: null,
                    } as unknown as Brand
                    openEdit(brand)
                }}
                onDelete={(row) => {
                    setDeletingBrand({
                        uuid: row.id,
                        name: row.primary,
                        category: "",
                        category_name: "",
                        created_at: "",
                        created_by: null,
                    } as unknown as Brand)
                }}
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent
                    showCloseButton={!submitting}
                    className="max-h-[90vh] max-w-lg w-full flex flex-col overflow-hidden"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {editingBrand ? "Edit brand" : "Add brand"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingBrand
                                ? "Update the brand details."
                                : "Provide a name and assign the brand to its category."}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={submitForm}
                        className="flex flex-col flex-1 min-h-0 space-y-4"
                    >
                        <div className="flex-1 overflow-y-auto space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="brand-name">Brand name</Label>
                                <Input
                                    id="brand-name"
                                    value={values.name}
                                    onChange={(event) =>
                                        setValues((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    disabled={submitting}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={values.category}
                                    onValueChange={(category) =>
                                        setValues((current) => ({
                                            ...current,
                                            category,
                                        }))
                                    }
                                    disabled={submitting || categories.length === 0}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.uuid}
                                                value={category.uuid}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {formError && (
                                <p
                                    role="alert"
                                    className="text-sm font-medium text-destructive"
                                >
                                    {formError}
                                </p>
                            )}
                        </div>

                        <FormDialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting
                                    ? "Saving…"
                                    : editingBrand
                                      ? "Save changes"
                                      : "Create brand"}
                            </Button>
                        </FormDialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(deletingBrand)}
                onOpenChange={(open) => !open && setDeletingBrand(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete brand?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{" "}
                            <strong>{deletingBrand?.name}</strong>. Products
                            using this brand may prevent this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={deleteBrand}
                            disabled={submitting}
                        >
                            {submitting ? "Deleting…" : "Delete brand"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
