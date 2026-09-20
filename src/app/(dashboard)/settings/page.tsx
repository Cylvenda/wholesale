"use client"

import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "react-toastify"
import { userServices } from "@/api/services/user.service"
import { PageHeader } from "@/components/shared/page-header"
import type { UserMeResponse } from "@/store/auth/auth.types"

interface SettingsFieldProps {
    label: string
    id: string
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    type?: string
}

function SettingsField({ label, id, value, onChange, disabled, type = "text" }: SettingsFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            />
        </div>
    )
}

interface SettingsCardProps {
    title: string
    description: string
    children: React.ReactNode
    onSave?: () => Promise<void>
    saving?: boolean
}

function SettingsCard({ title, description, children, onSave, saving }: SettingsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {children}
                {onSave && (
                    <div className="flex justify-end border-t border-border pt-4 gap-2">
                        <Button variant="outline" onClick={() => {}}>
                            Cancel
                        </Button>
                        <Button onClick={onSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin text-blue-600" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 size-4 text-blue-600" />
                                    Save changes
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProfile = async () => {
        try {
            const res = await userServices.getUserMe()
            const data: UserMeResponse = res.data
            setFirstName(data.first_name || "")
            setLastName(data.last_name || "")
            setEmail(data.email || "")
            setPhone(data.phone || "")
        } catch {
            setError("Unable to load your profile. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const load = async () => { await fetchProfile() }
        load()
    }, [])

    const handleSaveProfile = async () => {
        setSaving(true)
        setError(null)
        try {
            await userServices.updateUserMe({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
            })
            toast.success("Profile updated successfully.")
        } catch {
            setError("Unable to update your profile. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <main className="min-h-full bg-muted/30">
                <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
                    <PageHeader
                    eyebrow="Workspace configuration"
                    title="Settings"
                    description="Manage your personal profile."
                />
                    <Card>
                        <CardContent className="p-8">
                            <div className="flex items-center justify-center">
                                <Loader2 className="size-6 animate-spin text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-full bg-muted/30">
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
                <PageHeader
                    eyebrow="Workspace configuration"
                    title="Settings"
                    description="Manage your profile, business settings and application preferences."
                />

                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto">
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile">
                        <SettingsCard
                            title="Profile"
                            description="Personal details used in your workspace."
                            onSave={handleSaveProfile}
                            saving={saving}
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <SettingsField
                                    label="First name"
                                    id="first-name"
                                    value={firstName}
                                    onChange={setFirstName}
                                />
                                <SettingsField
                                    label="Last name"
                                    id="last-name"
                                    value={lastName}
                                    onChange={setLastName}
                                />
                                <SettingsField
                                    label="Email address"
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={setEmail}
                                    disabled
                                />
                                <SettingsField
                                    label="Phone number"
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={setPhone}
                                    disabled
                                />
                            </div>
                            {error && (
                                <p
                                    role="alert"
                                    className="text-sm font-medium text-destructive"
                                >
                                    {error}
                                </p>
                            )}
                        </SettingsCard>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}
