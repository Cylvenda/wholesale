"use client"

import { useCallback, useState } from "react"
import { Ruler } from "lucide-react"
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
import { getApiErrorMessage } from "@/lib/api-error"

function toRows(units: Unit[]): InventoryRow[] {
    return units.map((unit) => ({
        id: unit.uuid,
        primary: unit.name,
        secondary: unit.abbreviation || undefined,
        values: [
            unit.is_active ? "Active" : "Inactive",
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
        is_active: boolean
    }>({ name: "", abbreviation: "", is_active: true })
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const loadRows = useCallback(async () => {
        const rows = await inventoryService.listUnits()
        return toRows(rows)
    }, [])

    const openCreate = () => {
        setEditingUnit(null)
        setValues({ name: "", abbreviation: "", is_active: true })
        setFormError(null)
        setFormOpen(true)
    }

    const openEdit = (unit: Unit) => {
        setEditingUnit(unit)
        setValues({
            name: unit.name,
            abbreviation: unit.abbreviation ?? "",
            is_active: unit.is_active,
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
            is_active: values.is_active,
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
            setRefreshKey((prev) => prev + 1)
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Unable to save the unit."))
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
            setRefreshKey((prev) => prev + 1)
        } catch (deleteError) {
            toast.error(getApiErrorMessage(deleteError, "Unable to delete this unit. It may be referenced by products."))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <ResourcePage
                title="Units"
                description="Manage product measurement units (e.g., Bottle, Crate, Kilogram, Liter)."
                action="Add unit"
                columns={["Unit", "Abbreviation", "Status", "Created"]}
                loadRows={loadRows}
                refreshKey={refreshKey}
                viewIcon={<Ruler className="size-5" />}
                onAction={openCreate}
                onEdit={(row) => {
                    const unit: Unit = {
                        uuid: row.id,
                        name: row.primary,
                        abbreviation: row.secondary ?? null,
                        is_active: row.values[0] === "Active",
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
                        is_active: false,
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
                                    placeholder="e.g., Bottle, Crate, Kilogram, Liter"
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
                                    placeholder="e.g., btl, crt, kg, L"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit-active" className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        id="unit-active"
                                        type="checkbox"
                                        checked={values.is_active}
                                        onChange={(event) =>
                                            setValues((current) => ({
                                                ...current,
                                                is_active: event.target.checked,
                                            }))
                                        }
                                        disabled={submitting}
                                    />
                                    <span>Active</span>
                                </Label>
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