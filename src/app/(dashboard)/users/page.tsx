"use client"

import { useCallback, useState } from "react"
import {
    UserCheck,
    UserX,
} from "lucide-react"
import { toast } from "react-toastify"
import { userServices, type UserAdminResponse } from "@/api/services/user.service"
import { UserForm } from "@/components/users/user-form"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ResourcePage } from "@/components/resource-page"
import { Button } from "@/components/ui/button"
import type { InventoryRow, Status } from "@/lib/inventory-data"
import { formatDate } from "@/lib/format"

function toUserRole(role: string): Status {
    return role === "admin" || role === "manager" ? "active" : "inactive"
}

function toRows(users: UserAdminResponse[]): InventoryRow[] {
    return users.map((user) => ({
        id: user.uuid,
        primary: `${user.first_name} ${user.last_name}`.trim() || user.email,
        secondary: user.email,
        values: [
            user.role,
            formatDate(user.date_joined),
        ],
        status: toUserRole(user.role),
    }))
}

const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    salesperson: "Salesperson",
    storekeeper: "Storekeeper",
    accountant: "Accountant",
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserAdminResponse[]>([])
    const [editingUser, setEditingUser] = useState<UserAdminResponse | null>(null)
    const [viewingUser, setViewingUser] = useState<UserAdminResponse | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [viewOpen, setViewOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<UserAdminResponse | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const loadRows = useCallback(async () => {
        const rows = await userServices.listUsers()
        setUsers(rows)
        return toRows(rows)
    }, [])

    const handleEdit = useCallback(async (row: InventoryRow) => {
        try {
            const user = await userServices.getUser(row.id)
            setEditingUser(user)
            setFormOpen(true)
        } catch {
            toast.error("Unable to load user details.")
        }
    }, [])

    const handleView = useCallback((row: InventoryRow) => {
        const user = users.find((u) => u.uuid === row.id)
        if (user) {
            setViewingUser(user)
            setViewOpen(true)
        }
    }, [users])

    const handleDelete = useCallback((row: InventoryRow) => {
        const user = users.find((u) => u.uuid === row.id)
        if (user) {
            setDeleteTarget(user)
            setDeleteOpen(true)
        }
    }, [users])

    const handleFormSuccess = async () => {
        await loadRows()
        setFormOpen(false)
        setEditingUser(null)
        setRefreshKey((k) => k + 1)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        try {
            await userServices.deleteUser(deleteTarget.uuid)
            toast.success("User deleted successfully.")
            setDeleteOpen(false)
            setDeleteTarget(null)
            setRefreshKey((k) => k + 1)
        } catch {
            toast.error("Unable to delete this user. It may be protected.")
        }
    }

    const handleToggleActive = async (user: UserAdminResponse) => {
        try {
            await userServices.updateUser(user.uuid, { is_active: !user.is_active })
            toast.success(
                user.is_active
                    ? "User deactivated."
                    : "User activated."
            )
            setRefreshKey((k) => k + 1)
        } catch {
            toast.error("Unable to update user status.")
        }
    }

    const columns = [
        "User",
        "Role",
        "Status",
        "Joined",
    ]

    return (
        <>
            <ResourcePage
                title="Users"
                description="Manage team members, assign roles and control access."
                action="Add user"
                columns={columns}
                rows={toRows(users)}
                loadRows={loadRows}
                refreshKey={refreshKey}
                onAction={() => {
                    setEditingUser(null)
                    setFormOpen(true)
                }}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-2xl p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? "Edit user" : "Add user"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? "Update user details and role."
                                : "Create a new team member account."}
                        </DialogDescription>
                    </DialogHeader>
                    <UserForm
                        mode={editingUser ? "edit" : "create"}
                        user={editingUser}
                        onCancel={() => setFormOpen(false)}
                        onSubmit={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={viewOpen}
                onOpenChange={setViewOpen}
            >
                <DialogContent className="max-w-2xl p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {viewingUser
                                ? `${viewingUser.first_name} ${viewingUser.last_name}`.trim()
                                : "User details"}
                        </DialogTitle>
                        <DialogDescription>
                            Account details and role information.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingUser && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Email
                                    </p>
                                    <p className="mt-1">{viewingUser.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Phone
                                    </p>
                                    <p className="mt-1">{viewingUser.phone || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Role
                                    </p>
                                    <p className="mt-1 capitalize">
                                        {ROLE_LABELS[viewingUser.role] ??
                                            viewingUser.role}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Status
                                    </p>
                                    <p className="mt-1 capitalize">
                                        {viewingUser.is_active
                                            ? "Active"
                                            : "Inactive"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Joined
                                    </p>
                                    <p className="mt-1">
                                        {formatDate(viewingUser.date_joined)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Staff
                                    </p>
                                    <p className="mt-1">
                                        {viewingUser.is_staff
                                            ? "Yes"
                                            : "No"}
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setViewOpen(false)}
                                >
                                    Close
                                </Button>
                                <Button
                                    variant={
                                        viewingUser.is_active
                                            ? "outline"
                                            : "default"
                                    }
                                    onClick={() => {
                                        void handleToggleActive(viewingUser)
                                        setViewOpen(false)
                                    }}
                                >
                                    {viewingUser.is_active ? (
                                        <>
                                            <UserX className="mr-2 size-4 text-blue-600" />
                                            Deactivate
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="mr-2 size-4 text-blue-600" />
                                            Activate
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete user?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{" "}
                            {deleteTarget
                                ? `${deleteTarget.first_name} ${deleteTarget.last_name}`.trim()
                                : "this user"}
                            . This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Delete user
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
