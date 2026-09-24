"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { inventoryService } from "@/api/services/inventory.service"
import type { ReceiptData } from "@/api/services/inventory.service"
import { ReceiptDocument } from "@/components/reports/receipt-document"
import { Button } from "@/components/ui/button"

export default function ReceiptPage() {
    const router = useRouter()
    const { uuid } = useParams<{ uuid: string }>()
    const [receipt, setReceipt] = useState<ReceiptData | null>(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        let active = true

        inventoryService
            .getReceipt(uuid)
            .then((data) => {
                if (active) setReceipt(data)
            })
            .catch(() => {
                if (active) toast.error("Unable to load this receipt.")
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [uuid])

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const report = await inventoryService.downloadReceipt(uuid)
            const url = URL.createObjectURL(report.blob)
            const link = document.createElement("a")
            link.href = url
            link.download = report.filename
            link.click()
            URL.revokeObjectURL(url)
            toast.success("Receipt downloaded.")
        } catch {
            toast.error("Unable to download this receipt.")
        } finally {
            setDownloading(false)
        }
    }

    return (
        <main className="min-h-full bg-muted/30">
            <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">

                {loading ? (
                    <div className="flex min-h-80 items-center justify-center rounded-xl bg-card">
                        <Loader2 className="size-6 animate-spin text-blue-600" />
                    </div>
                ) : receipt ? (
                    <ReceiptDocument receipt={receipt} onDownload={handleDownload} />
                ) : (
                    <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground">
                        Receipt not found.
                    </div>
                )}

                {downloading && (
                    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
                        <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-3 text-sm shadow-lg">
                            <Loader2 className="size-4 animate-spin text-blue-600" />
                            Preparing receipt…
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
