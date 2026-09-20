"use client"

import Link from "next/link"
import { WifiOff, RefreshCw, Home } from "lucide-react"

export default function OfflinePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
            <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <WifiOff className="h-8 w-8 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">You are offline</h1>
                    <p className="text-sm text-muted-foreground">
                        StockLedger requires an internet connection to display
                        live inventory data, purchases, sales, and customer
                        records.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </button>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
                    >
                        <Home className="h-4 w-4" />
                        Go to login
                    </Link>
                </div>
            </div>
        </div>
    )
}
