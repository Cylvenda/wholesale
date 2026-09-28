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

function formatDateTime(value: string) {
     return new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
     }).format(new Date(value))
}

export function ThermalReceiptDocument({
     receipt,
     onDownload,
     downloading = false,
}: ThermalReceiptDocumentProps) {
     const isSale = "sale" in receipt
     const document = isSale ? receipt.sale : receipt.purchase
     const transactionDate = isSale ? receipt.sale.sale_date : receipt.purchase.purchase_date
     const partyLabel = isSale ? "Customer" : "Supplier"
     const partyName = isSale ? receipt.sale.customer : receipt.purchase.supplier
     const staffLabel = isSale ? "Cashier" : "Received By"
     const staffName = isSale ? receipt.sale.cashier : receipt.purchase.receiver

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
                         <div>{isSale ? "Invoice" : "Purchase"}</div>
                    </header>

                    <section className="receipt-business">
                         <strong>{receipt.business.name || "IMARA SHOP"}</strong>
                         {[
                              receipt.business.tax_number,
                              receipt.business.address,
                              receipt.business.phone,
                              receipt.business.email,
                         ].filter(Boolean).map((line, index) => (
                              <div key={`${index}-${line}`}>{line}</div>
                         ))}
                    </section>

                    <div className="receipt-rule">------------------------------------------------</div>
                    <section className="receipt-meta">
                         <ReceiptRow label="Document No.:" value={document.receipt_number} />
                         <ReceiptRow label="Date:" value={formatDateTime(transactionDate)} />
                         <ReceiptRow label={`${partyLabel}:`} value={partyName} />
                         <ReceiptRow label={`${staffLabel}:`} value={staffName || "-"} />
                         {!isSale && receipt.purchase.supplier_invoice_number && (
                              <ReceiptRow label="Supplier Inv.:" value={receipt.purchase.supplier_invoice_number} />
                         )}
                    </section>
                    <div className="receipt-rule">------------------------------------------------</div>

                    <section className="receipt-items">
                         <div className="receipt-item-heading">
                              <span>DESC</span>
                              <span>U.PRICE</span>
                              <span>DISC</span>
                              <span>AMOUNT</span>
                         </div>
                         <div className="receipt-qty-label">QTY</div>
                         {receipt.items.map((item) => (
                              <div className="receipt-item" key={item.uuid}>
                                   <div className="receipt-product-name">{item.product_name}</div>
                                   <div className="receipt-item-values">
                                        <span>{Number(item.quantity).toFixed(2)} {item.unit}</span>
                                        <span>{formatMoney(item.unit_price, receipt.currency)}</span>
                                        <span>{formatMoney(item.discount, receipt.currency)}</span>
                                        <span>{formatMoney(item.line_total, receipt.currency)}</span>
                                   </div>
                              </div>
                         ))}
                    </section>

                    <div className="receipt-rule">------------------------------------------------</div>
                    <section className="receipt-totals">
                         <ReceiptRow label="Sub Total:" value={formatMoney(receipt.totals.subtotal, receipt.currency)} />
                         {isSale && (
                              <ReceiptRow label="Discount:" value={formatMoney(receipt.totals.discount, receipt.currency)} />
                         )}
                         <ReceiptRow
                              label={isSale ? "Total:" : "Total Purchase:"}
                              value={formatMoney(receipt.totals.grand_total, receipt.currency)}
                              strong
                         />
                         {isSale && (
                              <>
                                   {receipt.payments.map((payment) => (
                                        <ReceiptRow
                                             key={payment.uuid}
                                             label={`${payment.method.replace(/_/g, " ")}:`}
                                             value={formatMoney(payment.amount, receipt.currency)}
                                        />
                                   ))}
                                   <ReceiptRow label="Paid:" value={formatMoney(receipt.totals.amount_paid, receipt.currency)} />
                                   <ReceiptRow label="Balance:" value={formatMoney(receipt.totals.outstanding_balance, receipt.currency)} />
                              </>
                         )}
                    </section>
                    <div className="receipt-rule">------------------------------------------------</div>
                    <footer className="receipt-footer">
                         {isSale ? receipt.business.receipt_footer || "Thank you for your business." : "GOODS RECEIVED"}
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
                .receipt-heading, .receipt-business, .receipt-footer { text-align: center; }
                .receipt-heading { margin-bottom: 10px; }
                .receipt-business { margin-bottom: 8px; }
                .receipt-business strong { display: block; font-size: 12px; font-weight: 700; }
                .receipt-rule { height: 14px; overflow: hidden; white-space: nowrap; }
                .receipt-row { display: grid; grid-template-columns: 34% minmax(0, 1fr); gap: 4px; }
                .receipt-row-value { text-align: right; overflow-wrap: anywhere; }
                .receipt-item-heading, .receipt-item-values {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto auto auto;
                    gap: 4px;
                    text-align: right;
                }
                .receipt-item-heading span:first-child, .receipt-item-values span:first-child { text-align: left; }
                .receipt-item-heading { font-weight: 700; }
                .receipt-qty-label { margin-bottom: 5px; }
                .receipt-item { margin-bottom: 7px; }
                .receipt-product-name { margin-bottom: 2px; }
                .receipt-item-values { font-size: 9px; }
                .receipt-totals .receipt-row { grid-template-columns: minmax(0, 1fr) auto; }
                .receipt-totals .receipt-row-value { white-space: nowrap; }
                .receipt-totals .receipt-row-strong { font-weight: 700; }
                .receipt-footer { margin-top: 6px; }
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