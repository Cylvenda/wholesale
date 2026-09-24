"use client"

import { CheckCircle2, Download, Printer } from "lucide-react"
import type { ReceiptData } from "@/api/services/inventory.service"
import { Button } from "@/components/ui/button"

type ReceiptDocumentProps = {
    receipt: ReceiptData
    onDownload?: () => void
}

function formatMoney(value: string | number) {
    return new Intl.NumberFormat("en-TZ", {
        style: "currency",
        currency: "TZS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value || 0))
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("en-TZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value))
}

export function ReceiptDocument({ receipt, onDownload }: ReceiptDocumentProps) {
    const businessName = receipt.business.name || "IMARA SHOP"
    const paymentMethods = receipt.payment_methods.length
        ? receipt.payment_methods.map((method) => method.replace(/_/g, " ")).join(", ")
        : "Not recorded"

    return (
        <>
            <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-primary">SALE RECEIPT</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">{receipt.sale.receipt_number}</h1>
                </div>
                <div className="flex gap-2">
                    {onDownload && (
                        <Button variant="outline" onClick={onDownload}>
                            <Download className="size-4" />
                            Download
                        </Button>
                    )}
                    <Button onClick={() => window.print()}>
                        <Printer className="size-4" />
                        Print receipt
                    </Button>
                </div>
            </div>

            <article className="receipt-document mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm sm:p-8">
                <header className="mb-6 border-b border-slate-200 pb-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="mb-1 text-xs font-bold tracking-[0.14em] text-blue-700">SALE RECEIPT</p>
                            <h2 className="text-xl font-bold">{businessName}</h2>
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="size-3.5" /> {receipt.sale.payment_status === "paid" ? "Paid" : receipt.sale.payment_status === "partial" ? "Partially paid" : "Unpaid"}
                        </div>
                    </div>
                    {[
                        receipt.business.address,
                        receipt.business.phone,
                        receipt.business.email,
                        receipt.business.tax_number,
                    ]
                        .filter(Boolean)
                        .map((line) => (
                            <p key={line} className="text-xs leading-5 text-slate-500">{line}</p>
                        ))}
                </header>

                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
                    <dt className="text-slate-500">Receipt</dt>
                    <dd className="text-right font-semibold">{receipt.sale.receipt_number}</dd>
                    <dt className="text-slate-500">Date</dt>
                    <dd className="text-right">{formatDateTime(receipt.sale.sale_date)}</dd>
                    <dt className="text-slate-500">Cashier</dt>
                    <dd className="text-right">{receipt.sale.cashier || "—"}</dd>
                    <dt className="text-slate-500">Customer</dt>
                    <dd className="text-right">{receipt.sale.customer}</dd>
                    <dt className="text-slate-500">Payment status</dt>
                    <dd className="text-right capitalize">{receipt.sale.payment_status}</dd>
                    <dt className="text-slate-500">Payment method</dt>
                    <dd className="text-right">{paymentMethods}</dd>
                </dl>

                <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[520px] text-sm">
                    <thead>
                        <tr className="bg-blue-700 text-left text-white">
                            <th className="px-3 py-3 font-semibold">Item</th>
                            <th className="px-3 py-3 text-right font-semibold">Qty</th>
                            <th className="px-3 py-3 text-right font-semibold">Unit price</th>
                            <th className="px-3 py-3 text-right font-semibold">Line total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receipt.items.map((item) => (
                            <tr key={item.uuid} className="border-b border-slate-100">
                                <td className="px-3 py-3 font-medium">{item.product_name}</td>
                                <td className="px-3 py-3 text-right tabular-nums">{item.quantity}</td>
                                <td className="px-3 py-3 text-right tabular-nums">{formatMoney(item.unit_price)}</td>
                                <td className="px-3 py-3 text-right tabular-nums font-medium">{formatMoney(item.line_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>

                <dl className="ml-auto mt-5 w-full max-w-xs text-sm">
                    <div className="flex justify-between py-1">
                        <dt className="text-slate-500">Subtotal</dt>
                        <dd className="tabular-nums">{formatMoney(receipt.totals.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between py-1">
                        <dt className="text-slate-500">Discount</dt>
                        <dd className="tabular-nums">{formatMoney(receipt.totals.discount)}</dd>
                    </div>
                    <div className="flex justify-between border-y border-slate-300 py-3 text-base font-bold">
                        <dt>Total</dt>
                        <dd className="tabular-nums">{formatMoney(receipt.totals.grand_total)}</dd>
                    </div>
                    <div className="flex justify-between py-1">
                        <dt className="text-slate-500">Paid</dt>
                        <dd className="tabular-nums">{formatMoney(receipt.totals.amount_paid)}</dd>
                    </div>
                    <div className="flex justify-between py-1">
                        <dt className="text-slate-500">Balance</dt>
                        <dd className="tabular-nums">{formatMoney(receipt.totals.outstanding_balance)}</dd>
                    </div>
                </dl>

                {receipt.payments.length > 0 && (
                    <section className="mt-6 overflow-x-auto rounded-lg border border-slate-200 p-4 text-sm">
                        <h3 className="mb-2 font-semibold">Payments</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-slate-500">
                                    <th className="pb-1 font-medium">Method</th>
                                    <th className="pb-1 font-medium">Reference</th>
                                    <th className="pb-1 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receipt.payments.map((payment) => (
                                    <tr key={payment.uuid} className="border-b border-slate-100">
                                        <td className="py-1 capitalize">{payment.method.replace(/_/g, " ")}</td>
                                        <td className="py-1">{payment.reference || "—"}</td>
                                        <td className="py-1 text-right tabular-nums">{formatMoney(payment.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                <footer className="mt-7 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
                    {receipt.business.receipt_footer || "Thank you for your business."}
                </footer>
            </article>

            <style jsx global>{`
                @media print {
                    @page { size: 80mm auto; margin: 8mm; }
                    body { background: #fff !important; }
                    aside, header, .no-print, .pwa-install-prompt, .pwa-update-banner { display: none !important; }
                    main { padding: 0 !important; overflow: visible !important; }
                    .receipt-document {
                        width: 80mm !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }
                    .receipt-document table { min-width: 0 !important; }
                }
                @media print and (min-width: 1000px) {
                    @page { size: A4; margin: 16mm; }
                    .receipt-document { width: 130mm !important; }
                }
            `}</style>
        </>
    )
}
