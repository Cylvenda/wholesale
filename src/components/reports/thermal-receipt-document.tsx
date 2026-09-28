"use client"

import { Download, Printer } from "lucide-react"
import type { PrintableReceiptData } from "@/api/services/inventory.service"
import { Button } from "@/components/ui/button"

type ThermalReceiptDocumentProps = {
     receipt: PrintableReceiptData
     onDownload?: () => void
     downloading?: boolean
}

function formatMoney(value: string | number, currency: string) {
     const amount = new Intl.NumberFormat("en-TZ", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
     }).format(Number(value || 0))
     return `${currency} ${amount}`
}

export function ThermalReceiptDocument({
     receipt,
     onDownload,
     downloading = false,
}: ThermalReceiptDocumentProps) {
     const isSale = "sale" in receipt
     const document = isSale ? receipt.sale : receipt.purchase
     const transactionDate = isSale ? receipt.sale.sale_date : receipt.purchase.purchase_date
     const partyName = isSale ? receipt.sale.customer : receipt.purchase.supplier
     const staffName = isSale ? receipt.sale.cashier : receipt.purchase.receiver
     const receiptDate = new Date(transactionDate)
     const cashAmount = isSale
          ? receipt.payments
               .filter((payment) => payment.method === "cash")
               .reduce((total, payment) => total + Number(payment.amount), 0)
          : null
     const totalItems = receipt.items.reduce((total, item) => total + Number(item.quantity), 0)
     const status = isSale ? receipt.sale.payment_status : "received"

     return (
          <>
               <div className="receipt-controls no-print">
                    {onDownload && (
                         <Button variant="outline" onClick={onDownload} disabled={downloading}>
                              <Download className="size-4" />
                              {downloading ? "Downloading" : "Download receipt"}
                         </Button>
                    )}
                    <Button onClick={() => window.print()}>
                         <Printer className="size-4" />
                         Print receipt
                    </Button>
               </div>

               <article className="thermal-receipt">
                    <header className="receipt-heading">
                         <strong>IMARA SHOP</strong>
                         <div>DAR ES SALAAM</div>
                    </header>

                    <section className="receipt-business">
                         {[
                              receipt.business.address,
                              receipt.business.email,
                         ].filter(Boolean).map((line, index) => (
                              <div key={`${index}-${line}`}>{line}</div>
                         ))}
                    </section>

                    <div className="receipt-rule">------------------------------------------------</div>
                    <section className="receipt-meta">
                         <ReceiptRow label="Bill No" value={document.receipt_number} />
                         <ReceiptRow label="Tel No" value={receipt.business.phone || "N/A"} />
                         <ReceiptRow label="Bill By" value={staffName || "N/A"} />
                         <ReceiptRow label="Date" value={receiptDate.toLocaleDateString("en-GB")} />
                         <ReceiptRow label="VAT Reg" value={receipt.business.tax_number || "N/A"} />
                         <ReceiptRow label="Tax" value="N/A" />
                         <ReceiptRow label="Counter" value="N/A" />
                         <ReceiptRow label="Time" value={receiptDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })} />
                         {!isSale && receipt.purchase.supplier_invoice_number && (
                              <ReceiptRow label="Supplier Inv" value={receipt.purchase.supplier_invoice_number} />
                         )}
                    </section>
                    <div className="receipt-rule">------------------------------------------------</div>

                    <section className="receipt-items">
                         <div className="receipt-item-heading">
                              <span>NO.</span>
                              <span>PRODUCT</span>
                              <span>QTY</span>
                              <span>PRICE</span>
                              <span>AMOUNT</span>
                         </div>
                         {receipt.items.map((item, index) => (
                              <div className="receipt-item" key={item.uuid}>
                                   <div className="receipt-item-row">
                                        <span>{index + 1}</span>
                                        <span className="receipt-product-name">{item.product_name}</span>
                                        <span>{Number(item.quantity).toLocaleString("en-TZ")}</span>
                                        <span>{formatMoney(item.unit_price, receipt.currency)}</span>
                                        <span>{formatMoney(item.line_total, receipt.currency)}</span>
                                   </div>
                                   <div className="receipt-item-description">
                                        <span>{item.unit}</span>
                                   </div>
                              </div>
                         ))}
                    </section>

                    <div className="receipt-rule">------------------------------------------------</div>
                    <section className="receipt-totals">
                         <ReceiptRow label="Total" value={formatMoney(receipt.totals.grand_total, receipt.currency)} strong />
                         <ReceiptRow label="Cash" value={cashAmount === null ? "N/A" : formatMoney(cashAmount, receipt.currency)} />
                         <ReceiptRow label="Change" value="N/A" />
                         <ReceiptRow label="Total Items" value={String(totalItems)} />
                         {isSale && Number(receipt.totals.discount) > 0 && (
                              <ReceiptRow label="Discount" value={formatMoney(receipt.totals.discount, receipt.currency)} />
                         )}
                         {isSale && Number(receipt.totals.outstanding_balance) > 0 && (
                              <ReceiptRow label="Balance" value={formatMoney(receipt.totals.outstanding_balance, receipt.currency)} />
                         )}
                         {isSale && receipt.payments.some((payment) => payment.method !== "cash") && (
                              receipt.payments
                                   .filter((payment) => payment.method !== "cash")
                                   .map((payment) => (
                                        <ReceiptRow
                                             key={payment.uuid}
                                             label={payment.method.replace(/_/g, " ")}
                                             value={formatMoney(payment.amount, receipt.currency)}
                                        />
                                   ))
                         )}
                    </section>
                    <div className="receipt-rule">------------------------------------------------</div>
                    <footer className="receipt-customer">
                         <strong>Taarifa Za Mteja</strong>
                         <ReceiptRow label={isSale ? "JINA LA MTEJA" : "JINA LA MSAMBAZAJI"} value={partyName} />
                         <ReceiptRow label="Status" value={status} />
                         <div className="receipt-notice">Hii Sio Stakabadhi Halali Ya Tra</div>
                         <div className="receipt-closing">****Issue Note From S I C****</div>
                    </footer>
               </article>

               <style jsx global>{`
                .receipt-controls {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin: 16px auto;
                }
                .thermal-receipt {
                    box-sizing: border-box;
                    width: 80mm;
                    max-width: calc(100vw - 24px);
                    margin: 0 auto 24px;
                    padding: 4mm;
                    background: #fff;
                    color: #000;
                    font: 10px/1.35 "Courier New", Courier, monospace;
                    overflow-wrap: anywhere;
                }
                    .receipt-heading, .receipt-business, .receipt-customer { text-align: center; }
                    .receipt-heading { margin-bottom: 8px; }
                    .receipt-heading strong { display: block; font-size: 13px; }
                    .receipt-business { margin-bottom: 8px; }
                .receipt-rule { height: 14px; overflow: hidden; white-space: nowrap; }
                    .receipt-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 4px; }
                .receipt-row-value { text-align: right; overflow-wrap: anywhere; }
                    .receipt-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 8px; }
                    .receipt-meta .receipt-row { grid-template-columns: auto minmax(0, 1fr); gap: 3px; }
                    .receipt-meta .receipt-row-value { text-align: left; }
                    .receipt-item-heading, .receipt-item-row, .receipt-item-description {
                         display: grid;
                         grid-template-columns: 3ch minmax(4ch, 1fr) 4ch 7ch 8ch;
                         column-gap: 2px;
                         align-items: start;
                    }
                    .receipt-item-heading { font-weight: 700; font-size: 8px; }
                    .receipt-item-heading span:not(:nth-child(2)), .receipt-item-row > span:not(:nth-child(2)) { text-align: right; }
                    .receipt-item { margin: 3px 0 7px; }
                    .receipt-product-name { text-align: left; overflow-wrap: anywhere; }
                    .receipt-item-row > span:nth-child(n + 4) { white-space: nowrap; font-size: 8px; }
                    .receipt-item-description span { grid-column: 2; }
                .receipt-totals .receipt-row { grid-template-columns: minmax(0, 1fr) auto; }
                .receipt-totals .receipt-row-value { white-space: nowrap; }
                .receipt-totals .receipt-row-strong { font-weight: 700; }
                    .receipt-customer { margin-top: 8px; }
                    .receipt-customer > strong { display: block; margin-bottom: 4px; }
                    .receipt-customer .receipt-row { text-align: left; }
                    .receipt-notice { margin-top: 8px; }
                    .receipt-closing { margin-top: 4px; }
                @media print {
                    @page { size: auto; margin: 2mm; }
                    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
                    body { color: #000 !important; }
                    aside, nav, .no-print, .pwa-install-prompt, .pwa-update-banner { display: none !important; }
                    main { display: block !important; width: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: #fff !important; }
                    .thermal-receipt { width: 100% !important; max-width: 80mm !important; margin: 0 !important; padding: 0 !important; page-break-inside: avoid; }
                    .receipt-item, .receipt-meta, .receipt-totals { break-inside: avoid; }
                }
            `}</style>
          </>
     )
}

function ReceiptRow({
     label,
     value,
     strong = false,
}: {
     label: string
     value: string
     strong?: boolean
}) {
     return (
          <div className={`receipt-row${strong ? " receipt-row-strong" : ""}`}>
               <span>{label}</span>
               <span className="receipt-row-value">{value}</span>
          </div>
     )
}