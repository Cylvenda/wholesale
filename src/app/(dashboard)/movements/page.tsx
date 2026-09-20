"use client"

import { useCallback, useState } from "react"
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
import type { InventoryRow, Status } from "@/lib/inventory-data"
import { formatDate } from "@/lib/format"

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
        </>
    )
}
