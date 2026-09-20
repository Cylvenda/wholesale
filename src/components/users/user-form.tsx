"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { userServices, type UserAdminResponse, type UserAdminPayload } from "@/api/services/user.service"

type UserFormProps = {
    mode: "create" | "edit"
    user?: UserAdminResponse | null
    onCancel: () => void
    onSubmit: () => Promise<void>
}

const USER_ROLES = [
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "salesperson", label: "Salesperson" },
    { value: "storekeeper", label: "Storekeeper" },
    { value: "accountant", label: "Accountant" },
] as const

export function UserForm({ mode, user, onCancel, onSubmit }: UserFormProps) {
    const [firstName, setFirstName] = useState(user?.first_name ?? "")
    const [lastName, setLastName] = useState(user?.last_name ?? "")
    const [email, setEmail] = useState(user?.email ?? "")
    const [phone, setPhone] = useState(user?.phone ?? "")
    const [role, setRole] = useState(user?.role ?? "salesperson")
    const [isActive, setIsActive] = useState(user?.is_active ?? true)
    const [password, setPassword] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError(null)

        if (!email.trim()) {
            setFormError("Email address is required.")
            return
        }
        if (!phone.trim()) {
            setFormError("Phone number is required.")
            return
        }
        if (mode === "create" && !password) {
            setFormError("Password is required when creating a new user.")
            return
        }

        setSubmitting(true)

        const payload: UserAdminPayload = {
            email: email.trim(),
            phone: phone.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role,
            is_active: isActive,
            ...(mode === "create" ? { password } : {}),
        }

        try {
            if (mode === "edit" && user) {
                await userServices.updateUser(user.uuid, payload)
                toast.success("User updated successfully.")
            } else {
                await userServices.createUser(payload)
                toast.success("User created successfully.")
            }
            await onSubmit()
        } catch {
            setFormError(
                "Unable to save the user. Please review the details and try again."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="user-first-name">First name</Label>
                    <Input
                        id="user-first-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={submitting}
                        placeholder="First name"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="user-last-name">Last name</Label>
                    <Input
                        id="user-last-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={submitting}
                        placeholder="Last name"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="user-email">Email address</Label>
                <Input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    placeholder="user@example.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="user-phone">Phone number</Label>
                <Input
                    id="user-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    placeholder="+255 7XX XXX XXX"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as typeof role)} disabled={submitting}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            {USER_ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="user-password">
                        {mode === "create" ? "Password" : "Password (leave blank to keep)"}
                    </Label>
                    <Input
                        id="user-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting}
                        placeholder={mode === "create" ? "Set initial password" : "New password"}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="user-active" className="cursor-pointer">
                    Active user
                </Label>
                <Switch
                    id="user-active"
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
                          : "Create user"}
                </Button>
            </DialogFooter>
        </form>
    )
}
