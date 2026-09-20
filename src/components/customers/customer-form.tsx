"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import {
    inventoryService,
    type Customer,
    type CustomerPayload,
} from "@/api/services/inventory.service"

type CustomerFormProps = {
    mode: "create" | "edit"
    customer?: Customer | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

export function CustomerForm({
    mode,
    customer,
    onCancel,
    onSubmit,
}: CustomerFormProps) {
    const [name, setName] = useState(customer?.name ?? "")
    const [phone, setPhone] = useState(customer?.phone ?? "")
    const [email, setEmail] = useState(customer?.email ?? "")
    const [businessLocation, setBusinessLocation] = useState(
        customer?.business_location ?? ""
    )
    const [isActive, setIsActive] = useState(customer?.is_active ?? true)
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError(null)

        if (!name.trim()) {
            setFormError("Customer name is required.")
            return
        }

        setSubmitting(true)

        const payload: CustomerPayload = {
            name: name.trim(),
            phone: phone.trim() || "",
            email: email.trim(),
            business_location:
                businessLocation.trim() || "",
            is_active: isActive,
        }

        try {
            if (mode === "edit" && customer) {
                await inventoryService.updateCustomer(customer.uuid, payload)
                toast.success("Customer updated successfully.")
            } else {
                await inventoryService.createCustomer(payload)
                toast.success("Customer created successfully.")
            }
            await onSubmit()
        } catch {
            setFormError(
                "Unable to save the customer. Please review the details and try again."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="customer-name">Customer name</Label>
                <Input
                    id="customer-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="customer-phone">Phone number</Label>
                    <Input
                        id="customer-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={submitting}
                        placeholder="+255 7XX XXX XXX"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="customer-email">Email address</Label>
                    <Input
                        id="customer-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={submitting}
                        placeholder="customer@example.com"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="customer-location">Business location</Label>
                <Input
                    id="customer-location"
                    value={businessLocation}
                    onChange={(e) => setBusinessLocation(e.target.value)}
                    disabled={submitting}
                    placeholder="Enter business address or location"
                />
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="customer-active" className="cursor-pointer">
                    Active customer
                </Label>
                <Switch
                    id="customer-active"
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
                          : "Create customer"}
                </Button>
            </DialogFooter>
        </form>
    )
}
