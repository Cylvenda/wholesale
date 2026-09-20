"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import {
    inventoryService,
    type Supplier,
    type SupplierPayload,
} from "@/api/services/inventory.service"

type SupplierFormProps = {
    mode: "create" | "edit"
    supplier?: Supplier | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

export function SupplierForm({
    mode,
    supplier,
    onCancel,
    onSubmit,
}: SupplierFormProps) {
    const [name, setName] = useState(supplier?.name ?? "")
    const [phone, setPhone] = useState(supplier?.phone ?? "")
    const [email, setEmail] = useState(supplier?.email ?? "")
    const [address, setAddress] = useState(supplier?.address ?? "")
    const [isActive, setIsActive] = useState(supplier?.is_active ?? true)
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError(null)

        if (!name.trim()) {
            setFormError("Supplier name is required.")
            return
        }

        setSubmitting(true)

        const payload: SupplierPayload = {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            address: address.trim() || "",
            is_active: isActive,
        }

        try {
            if (mode === "edit" && supplier) {
                await inventoryService.updateSupplier(supplier.uuid, payload)
                toast.success("Supplier updated successfully.")
            } else {
                await inventoryService.createSupplier(payload)
                toast.success("Supplier created successfully.")
            }
            await onSubmit()
        } catch {
            setFormError(
                "Unable to save the supplier. Please review the details and try again."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="supplier-name">Supplier name</Label>
                <Input
                    id="supplier-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="supplier-phone">Phone number</Label>
                    <Input
                        id="supplier-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={submitting}
                        placeholder="255712000151"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="supplier-email">Email address</Label>
                    <Input
                        id="supplier-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={submitting}
                        placeholder="supplier@example.com"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="supplier-address">Address</Label>
                <Textarea
                    id="supplier-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={submitting}
                    placeholder="Enter supplier address"
                    rows={3}
                />
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="supplier-active" className="cursor-pointer">
                    Active supplier
                </Label>
                <Switch
                    id="supplier-active"
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
                          : "Create supplier"}
                </Button>
            </DialogFooter>
        </form>
    )
}
