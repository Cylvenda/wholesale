"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "rejected" }>
}

const STORAGE_KEY = "pwa-install-dismissed"

const ALLOWED_PATHS = ["/", "/login"]

export function PwaInstallPrompt() {
    const pathname = usePathname()
    const [deferredEvent, setDeferredEvent] =
        useState<BeforeInstallPromptEvent | null>(null)
    const [visible, setVisible] = useState(false)

    const shouldShowOnRoute =
        ALLOWED_PATHS.includes(pathname) || pathname.startsWith("/reset/")

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!shouldShowOnRoute) return

        // Already running as installed PWA → hide prompt.
        if (window.matchMedia("(display-mode: standalone)").matches) return

        // If user dismissed recently, keep it hidden.
        if (localStorage.getItem(STORAGE_KEY)) return

        const handler = (e: BeforeInstallPromptEvent) => {
            e.preventDefault()
            setDeferredEvent(e)
            setVisible(true)
        }

         window.addEventListener("beforeinstallprompt" as string, handler as EventListener)
         return () =>
             window.removeEventListener("beforeinstallprompt" as string, handler as EventListener)
    }, [shouldShowOnRoute])

    const handleInstall = async () => {
        if (!deferredEvent) return
        deferredEvent.prompt()
        const choice = await deferredEvent.userChoice
        if (choice.outcome === "accepted") {
            localStorage.setItem(STORAGE_KEY, "true")
        }
        setVisible(false)
    }

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, "true")
        setVisible(false)
    }

    if (!visible || !shouldShowOnRoute) return null

    return (
        <Card className="fixed bottom-6 right-6 z-50 flex items-center gap-4 px-4 py-3 shadow-lg sm:bottom-8 sm:right-8">
            <Download className="h-5 w-5 text-primary" />
            <div>
                <p className="text-sm font-semibold">Install StockLedger</p>
                <p className="text-xs text-muted-foreground">
                    Install on your device for faster access and an app-like experience.
                </p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleInstall}
            >
                Install
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDismiss}
            >
                <X className="h-3 w-3" />
            </Button>
        </Card>
    )
}
