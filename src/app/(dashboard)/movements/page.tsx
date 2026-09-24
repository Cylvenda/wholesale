"use client"

import { useCallback, useState } from "react"
import { ArrowLeftRight } from "lucide-react"
import {
    inventoryService,
    type StockMovement,
} from "@/api/services/inventory.service"
import { StockAdjustmentForm } from "@/components/stock/stock-adjustment-form"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ResourcePage } from "@/components/resource-page"
import { ViewDialog } from "@/components/shared/view-dialog"
import type { InventoryRow, Status } from "@/lib/inventory-data"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"

function toMovementStatus(type: string): Status {
    const t = type.toLowerCase()
    if (t.includes("sale")) return "sale"
    if (t.includes("purchase")) return "purchase"
    if (t.includes("return")) return "return"
    return "adjustment"
}

function toRows(movements: StockMovement[]): InventoryRow[] {
    return movements.map((movement) => ({
        id: movement.uuid,
        primary: movement.product_name || "Unknown product",
        secondary: movement.reference || "Stock movement",
        values: [
            movement.movement_type,
            String(movement.quantity),
            formatDate(movement.created_at),
        ],
        status: toMovementStatus(movement.movement_type),
    }))
}

export default function StockMovementsPage() {
    const [movements, setMovements] = useState<StockMovement[]>([])
    const [adjustmentOpen, setAdjustmentOpen] = useState(false)
    const [viewingMovement, setViewingMovement] = useState<StockMovement | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const loadRows = useCallback(async () => {
        const rows = await inventoryService.listStockMovements()
        setMovements(rows)
        return toRows(rows)
    }, [])

    const handleSuccess = () => {
        setAdjustmentOpen(false)
        setRefreshKey((k) => k + 1)
    }

    const handleView = (row: InventoryRow) => {
        const movement = movements.find((m) => m.uuid === row.id)
        if (movement) setViewingMovement(movement)
    }

    return (
        <>
            <ResourcePage
                title="Stock movements"
                description="A complete record of stock entering and leaving the warehouse."
                action="Add adjustment"
                 columns={["Product", "Type", "Quantity", "Created", "Status"]}
                rows={toRows(movements)}
                loadRows={loadRows}
                refreshKey={refreshKey}
                onView={handleView}
                onAction={() => setAdjustmentOpen(true)}
            />

            <Dialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
                <DialogContent className="max-w-2xl p-6">
                    <DialogHeader>
                        <DialogTitle>Add stock adjustment</DialogTitle>
                        <DialogDescription>
                            Record a stocktake surplus or loss to adjust
                            inventory levels.
                        </DialogDescription>
                    </DialogHeader>
                    <StockAdjustmentForm
                        onCancel={() => setAdjustmentOpen(false)}
                        onSuccess={async () => {
                            await loadRows()
                            handleSuccess()
                        }}
                    />
                </DialogContent>
            </Dialog>

            {viewingMovement && (
                <ViewDialog
                    open={Boolean(viewingMovement)}
                    onOpenChange={() => setViewingMovement(null)}
                    title={viewingMovement.product_name || "Unknown product"}
                    description={viewingMovement.reference || undefined}
                    status={toMovementStatus(viewingMovement.movement_type)}
                    icon={<ArrowLeftRight className="size-5" />}
                    fields={[
                        { label: "Reference", value: viewingMovement.reference || "—" },
                        { label: "Type", value: viewingMovement.movement_type },
                        { label: "Quantity", value: String(viewingMovement.quantity) },
                        { label: "Created", value: formatDate(viewingMovement.created_at) },
                    ]}
                    sections={[
                        {
                            label: "Notes",
                            content: (
                                <p className="text-sm text-foreground">
                                    {viewingMovement.notes || "No notes provided."}
                                </p>
                            ),
                        },
                    ]}
                    actions={
                        <Button
                            variant="outline"
                            onClick={() => setViewingMovement(null)}
                        >
                            Close
                        </Button>
                    }
                />
            )}
        </>
    )
}
