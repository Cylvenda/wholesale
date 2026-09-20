"use client"

import { useCallback, useState } from "react"
import { toast } from "react-toastify"
import {
    inventoryService,
    type Unit,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

function toRows(units: Unit[]): InventoryRow[] {
    return units.map((unit) => ({
        id: unit.uuid,
        primary: unit.name,
        secondary: unit.abbreviation || undefined,
        values: [
            String(unit.quantity),
            formatDate(unit.created_at),
        ],
    }))
}

export default function UnitsPage() {
    const [formOpen, setFormOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
    const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)
    const [values, setValues] = useState<{
        name: string
        abbreviation: string
        quantity: number
    }>({ name: "", abbreviation: "", quantity: 1 })
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const loadRows = useCallback(async () => {
        const rows = await inventoryService.listUnits()
        return toRows(rows)
    }, [])

    const openCreate = () => {
        setEditingUnit(null)
        setValues({ name: "", abbreviation: "", quantity: 1 })
        setFormError(null)
        setFormOpen(true)
    }

    const openEdit = (unit: Unit) => {
        setEditingUnit(unit)
        setValues({
            name: unit.name,
            abbreviation: unit.abbreviation ?? "",
            quantity: unit.quantity,
        })
        setFormError(null)
        setFormOpen(true)
    }

    const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!values.name.trim()) {
            setFormError("Unit name is required.")
            return
        }

        setSubmitting(true)
        setFormError(null)

        const payload = {
            name: values.name.trim(),
            abbreviation: values.abbreviation.trim() || undefined,
            quantity: values.quantity,
        }

        try {
            if (editingUnit) {
                await inventoryService.updateUnit(editingUnit.uuid, payload)
                toast.success("Unit updated successfully.")
            } else {
                await inventoryService.createUnit(payload)
                toast.success("Unit created successfully.")
            }
            setFormOpen(false)
        } catch (submitError) {
            setFormError(
                messageFrom(
                    submitError,
                    "Unable to save the unit. Please review the details and try again."
                )
            )
        } finally {
            setSubmitting(false)
        }
    }

    const deleteUnit = async () => {
        if (!deletingUnit) return
        setSubmitting(true)
        try {
            await inventoryService.deleteUnit(deletingUnit.uuid)
            toast.success("Unit deleted successfully.")
            setDeletingUnit(null)
        } catch (deleteError) {
            toast.error(
                messageFrom(
                    deleteError,
                    "Unable to delete this unit. It may be referenced by products."
                )
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <ResourcePage
                title="Units"
                description="Manage product measurement units (e.g., kg, pieces, litres)."
                action="Add unit"
                columns={["Unit", "Quantity", "Created"]}
                loadRows={loadRows}
                onAction={openCreate}
                onEdit={(row) => {
                    const unit: Unit = {
                        uuid: row.id,
                        name: row.primary,
                        abbreviation: row.secondary ?? null,
                        quantity: parseInt(row.values[0], 10) || 1,
                        created_at: "",
                        created_by: null,
                    } as unknown as Unit
                    openEdit(unit)
                }}
                onDelete={(row) => {
                    setDeletingUnit({
                        uuid: row.id,
                        name: row.primary,
                        abbreviation: null,
                        quantity: 0,
                        created_at: "",
                        created_by: null,
                    } as unknown as Unit)
                }}
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent
                    showCloseButton={!submitting}
                    className="max-h-[90vh] max-w-lg w-full flex flex-col overflow-hidden"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {editingUnit ? "Edit unit" : "Add unit"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUnit
                                ? "Update the unit details."
                                : "Define a new measurement unit for your products."}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={submitForm}
                        className="flex flex-col flex-1 min-h-0 space-y-4"
                    >
                        <div className="flex-1 overflow-y-auto space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="unit-name">Unit name</Label>
                                <Input
                                    id="unit-name"
                                    value={values.name}
                                    onChange={(event) =>
                                        setValues((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    disabled={submitting}
                                    autoFocus
                                    placeholder="e.g., Kilogram, Piece, Litre"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit-abbreviation">
                                    Abbreviation
                                </Label>
                                <Input
                                    id="unit-abbreviation"
                                    value={values.abbreviation}
                                    onChange={(event) =>
                                        setValues((current) => ({
                                            ...current,
                                            abbreviation: event.target.value,
                                        }))
                                    }
                                    disabled={submitting}
                                    placeholder="e.g., kg, pc, L"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit-quantity">
                                    Quantity per unit
                                </Label>
                                <Input
                                    id="unit-quantity"
                                    type="number"
                                    min="1"
                                    value={values.quantity}
                                    onChange={(event) =>
                                        setValues((current) => ({
                                            ...current,
                                            quantity: Math.max(
                                                1,
                                                parseInt(event.target.value, 10) || 1
                                            ),
                                        }))
                                    }
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
                                    : editingUnit
                                      ? "Save changes"
                                      : "Create unit"}
                            </Button>
                        </FormDialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(deletingUnit)}
                onOpenChange={(open) => !open && setDeletingUnit(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete unit?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{" "}
                            <strong>{deletingUnit?.name}</strong>. Products
                            using this unit may prevent this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={deleteUnit}
                            disabled={submitting}
                        >
                            {submitting ? "Deleting…" : "Delete unit"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
