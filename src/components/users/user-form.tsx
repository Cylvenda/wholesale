"use client"

import { useState } from "react"
import axios from "axios"
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

const passwordRequirements = [
    { label: "8 to 20 characters", test: (value: string) => value.length >= 8 && value.length <= 20 },
    { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
    { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
    { label: "One number", test: (value: string) => /[0-9]/.test(value) },
    { label: "One special character", test: (value: string) => /[^a-zA-Z0-9]/.test(value) },
]

function getBackendError(error: unknown): string {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error
            ? error.message
            : "Unable to save the user. Please try again."
    }

    const collectMessages = (value: unknown): string[] => {
        if (typeof value === "string" && value.trim()) return [value.trim()]
        if (Array.isArray(value)) return value.flatMap(collectMessages)
        if (value && typeof value === "object") {
            return Object.values(value as Record<string, unknown>).flatMap(collectMessages)
        }
        return []
    }

    const messages = collectMessages(error.response?.data)
    return messages.length
        ? messages.join(" ")
        : error.message || "Unable to save the user. Please try again."
}

export function UserForm({ mode, user, onCancel, onSubmit }: UserFormProps) {
    const [firstName, setFirstName] = useState(user?.first_name ?? "")
    const [lastName, setLastName] = useState(user?.last_name ?? "")
    const [email, setEmail] = useState(user?.email ?? "")
    const [phone, setPhone] = useState(user?.phone ?? "")
    const [role, setRole] = useState(user?.role ?? "salesperson")
    const [isActive, setIsActive] = useState(user?.is_active ?? true)
    const [password, setPassword] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!email.trim()) {
            toast.error("Email address is required.")
            return
        }
        if (!phone.trim()) {
            toast.error("Phone number is required.")
            return
        }
        if (mode === "create" && passwordRequirements.some(({ test }) => !test(password))) {
            toast.error("Please meet all password requirements.")
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
        } catch (error: unknown) {
            toast.error(getBackendError(error))
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

                {mode === "create" && (
                    <div className="space-y-2">
                        <Label htmlFor="user-password">Password</Label>
                        <Input
                            id="user-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={submitting}
                            placeholder="Set initial password"
                            autoComplete="new-password"
                            required
                            maxLength={20}
                        />
                        <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                            {passwordRequirements.map(({ label, test }) => (
                                <li
                                    key={label}
                                    className={password && test(password) ? "text-emerald-700" : undefined}
                                >
                                    {password && test(password) ? "✓" : "•"} {label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
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
