"use client"

import { useCallback, useState } from "react"
import { toast } from "react-toastify"
import {
    inventoryService,
    type Category,
    type CategoryPayload,
} from "@/api/services/inventory.service"
import { useRefresh } from "@/hooks/use-refresh"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter as FormDialogFooter } from "@/components/ui/dialog"
import { ResourcePage } from "@/components/resource-page"
import type { InventoryRow } from "@/lib/inventory-data"
import { formatDate } from "@/lib/format"

const emptyForm: CategoryPayload = {
    name: "",
    description: "",
}

function messageFrom(error: unknown, fallback: string) {
    if (typeof error === "object" && error && "response" in error) {
        const response = error.response as {
            data?: { detail?: string }
        }
        return response.data?.detail ?? fallback
    }
    return fallback
}

function toRows(categories: Category[]): InventoryRow[] {
    return categories.map((category) => ({
        id: category.uuid,
        primary: category.name,
        secondary: category.description || undefined,
        values: [formatDate(category.created_at)],
    }))
}

export default function CategoriesPage() {
    const { refreshKey, refresh } = useRefresh()
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Category | null>(null)
    const [deleting, setDeleting] = useState<Category | null>(null)
    const [form, setForm] = useState<CategoryPayload>(emptyForm)
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const loadRows = useCallback(async () => {
        const rows = await inventoryService.listCategories()
        return toRows(rows)
    }, [])

    const openForm = (category?: Category) => {
        setEditing(category ?? null)
        setForm(
            category
                ? {
                      name: category.name,
                      description: category.description,
                  }
                : emptyForm
        )
        setFormError(null)
        setFormOpen(true)
    }

    const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!form.name.trim()) {
            setFormError("Category name is required.")
            return
        }

        setSubmitting(true)
        setFormError(null)
        try {
            if (editing) {
                await inventoryService.updateCategory(editing.uuid, {
                    ...form,
                    name: form.name.trim(),
                })
                toast.success("Category updated successfully.")
            } else {
                await inventoryService.createCategory({
                    ...form,
                    name: form.name.trim(),
                })
                toast.success("Category created successfully.")
            }
            setFormOpen(false)
            refresh()
        } catch (submitError) {
            setFormError(
                messageFrom(
                    submitError,
                    "Unable to save the category. It may already exist."
                )
            )
        } finally {
            setSubmitting(false)
        }
    }

    const deleteCategory = async () => {
        if (!deleting) return
        setSubmitting(true)
        try {
            await inventoryService.deleteCategory(deleting.uuid)
            toast.success("Category deleted successfully.")
            setDeleting(null)
            refresh()
        } catch {
            toast.error(
                "Unable to delete this category. It may be in use by brands."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <ResourcePage
                title="Categories"
                description="Organize the catalogue into clear product groups."
                action="Add category"
                columns={["Category", "Created"]}
                loadRows={loadRows}
                refreshKey={refreshKey}
                onAction={() => openForm()}
                onEdit={(row) => {
                    const category = {
                        uuid: row.id,
                        name: row.primary,
                        description: row.secondary ?? "",
                        created_at: "",
                    } as Category
                    openForm(category)
                }}
                onDelete={(row) => {
                    const category = {
                        uuid: row.id,
                        name: row.primary,
                        description: "",
                        created_at: "",
                    } as Category
                    setDeleting(category)
                }}
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent
                    showCloseButton={!submitting}
                    className="max-h-[90vh] max-w-lg w-full flex flex-col overflow-hidden"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Edit category" : "Add category"}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? "Update the category details."
                                : "Define a new product category for your catalogue."}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={submitForm}
                        className="flex flex-col flex-1 min-h-0 space-y-4"
                    >
                        <div className="flex-1 overflow-y-auto space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="category-name">
                                    Category name
                                </Label>
                                <Input
                                    id="category-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    disabled={submitting}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category-description">
                                    Description
                                </Label>
                                <Textarea
                                    id="category-description"
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                    disabled={submitting}
                                    placeholder="Optional description"
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
                                    : editing
                                      ? "Save changes"
                                      : "Create category"}
                            </Button>
                        </FormDialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete category?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{" "}
                            <strong>{deleting?.name}</strong>. Brands using
                            this category may prevent this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={deleteCategory}
                            disabled={submitting}
                        >
                            {submitting ? "Deleting…" : "Delete category"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
