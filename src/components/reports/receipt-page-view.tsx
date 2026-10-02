"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "react-toastify"
import {
     inventoryService,
     type PrintableReceiptData,
} from "@/api/services/inventory.service"
import { ThermalReceiptDocument } from "@/components/reports/thermal-receipt-document"
import { getApiErrorMessage, getApiErrorMessageAsync } from "@/lib/api-error"

type ReceiptPageViewProps = {
     uuid: string
     kind: "sale" | "purchase"
}

export function ReceiptPageView({ uuid, kind }: ReceiptPageViewProps) {
     const [result, setResult] = useState<{
          key: string
          receipt?: PrintableReceiptData
          failed?: boolean
          errorMessage?: string
     } | null>(null)
     const [downloading, setDownloading] = useState(false)
     const requestKey = `${kind}:${uuid}`

     useEffect(() => {
          let active = true

          const request = kind === "sale"
               ? inventoryService.getReceipt(uuid)
               : inventoryService.getPurchaseReceipt(uuid)

          request
               .then((data) => {
                    if (active) setResult({ key: requestKey, receipt: data })
               })
               .catch((error: unknown) => {
                    if (active) {
                         const errorMessage = getApiErrorMessage(error, "Unable to load this receipt.")
                         setResult({ key: requestKey, failed: true, errorMessage })
                         toast.error(errorMessage)
                    }
               })

          return () => {
               active = false
          }
     }, [uuid, kind, requestKey])

     const resultIsCurrent = result?.key === requestKey
     const loading = !resultIsCurrent
     const receipt = resultIsCurrent ? result.receipt ?? null : null

     const handleDownload = async () => {
          setDownloading(true)
          try {
               const report = kind === "sale"
                    ? await inventoryService.downloadReceipt(uuid)
                    : await inventoryService.downloadPurchaseReceipt(uuid)
               const url = URL.createObjectURL(report.blob)
               const link = document.createElement("a")
               link.href = url
               link.download = report.filename
               link.click()
               URL.revokeObjectURL(url)
               toast.success("Receipt downloaded.")
          } catch (error: unknown) {
               toast.error(await getApiErrorMessageAsync(error, "Unable to download this receipt."))
          } finally {
               setDownloading(false)
          }
     }

     return (
          <main className="min-h-screen bg-white px-3 py-2 text-black">
               {loading ? (
                    <div className="py-8 text-center font-mono text-sm">
                         <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                         Loading receipt...
                    </div>
               ) : receipt ? (
                    <ThermalReceiptDocument
                         receipt={receipt}
                         onDownload={handleDownload}
                         downloading={downloading}
                    />
               ) : result?.failed ? (
                    <p className="py-8 text-center font-mono text-sm">{result.errorMessage}</p>
               ) : (
                    <p className="py-8 text-center font-mono text-sm">Receipt not found.</p>
               )}
          </main>
     )
}