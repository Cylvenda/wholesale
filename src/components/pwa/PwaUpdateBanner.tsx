"use client"

import { useEffect, useState } from "react"
import { RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type UpdateDetail = {
    registration: ServiceWorkerRegistration
}

export function PwaUpdateBanner() {
    const [show, setShow] = useState(false)
    const [registration, setRegistration] =
        useState<ServiceWorkerRegistration | null>(null)

    useEffect(() => {
        const handler = (e: CustomEvent<UpdateDetail>) => {
            setRegistration(e.detail.registration)
            setShow(true)
        }
        window.addEventListener("pwa-update-available", handler as EventListener)
        return () =>
            window.removeEventListener("pwa-update-available", handler as EventListener)
    }, [])

    const handleUpdate = () => {
        if (!registration?.waiting) return
        registration.waiting.postMessage({ type: "SKIP_WAITING" })

        const interval = setInterval(() => {
            if (!registration || registration.active?.state === "activated") {
                clearInterval(interval)
                window.location.reload()
            }
        }, 500)
    }

    const handleDismiss = () => setShow(false)

    if (!show) return null

    return (
        <Card className="fixed top-0 left-0 right-0 z-50 mx-auto my-4 flex items-center justify-between gap-4 px-4 py-3 shadow-lg sm:max-w-md sm:rounded-lg">
            <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-primary" />
                <div>
                    <p className="text-sm font-semibold">New version available</p>
                    <p className="text-xs text-muted-foreground">
                        Refresh to get the latest version.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleUpdate}>
                    Update
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleDismiss}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        </Card>
    )
}
