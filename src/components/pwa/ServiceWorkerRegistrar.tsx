"use client"

import { useEffect, useState } from "react"

const SW_URL = "/sw.js"

export function ServiceWorkerRegistrar() {
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

    useEffect(() => {
        if (
            typeof window === "undefined" ||
            !("serviceWorker" in navigator) ||
            process.env.NODE_ENV !== "production"
        ) {
            return
        }

        window.addEventListener("load", () => {
            navigator.serviceWorker
                .register(SW_URL)
                .then((reg) => setRegistration(reg))
                .catch((err) => console.error("SW registration failed:", err))
        })
    }, [])

    useEffect(() => {
        if (!registration) return

        const updateHandler = () => {
            const event = new CustomEvent("pwa-update-available", {
                detail: { registration },
            })
            window.dispatchEvent(event)
        }

        registration.addEventListener("updatefound", updateHandler)
        const newWorker = registration.active

        if (newWorker) {
            newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "activated") {
                    // The new worker finished installing; notify banners.
                    updateHandler()
                }
            })
        }

        return () => {
            registration.removeEventListener("updatefound", updateHandler)
            newWorker?.removeEventListener("statechange", updateHandler)
        }
    }, [registration])

    return null
}
