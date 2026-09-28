"use client"

import { useParams } from "next/navigation"
import { ReceiptPageView } from "@/components/reports/receipt-page-view"

export default function ReceiptPage() {
    const { uuid } = useParams<{ uuid: string }>()
    return <ReceiptPageView uuid={uuid} kind="sale" />
}
