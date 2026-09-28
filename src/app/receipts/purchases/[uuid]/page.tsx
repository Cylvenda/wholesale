"use client"

import { useParams } from "next/navigation"
import { ReceiptPageView } from "@/components/reports/receipt-page-view"

export default function PurchaseReceiptPage() {
     const { uuid } = useParams<{ uuid: string }>()
     return <ReceiptPageView uuid={uuid} kind="purchase" />
}