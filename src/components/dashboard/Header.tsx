"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    ChevronDown,
    LogOut,
    Menu,
    Search,
    Settings,
    User,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ThemeToggle from "@/components/theme/theme-toggle"

interface HeaderProps {
    onMenuToggle?: () => void
    userName?: string
    onLogout?: () => void
}

export function Header({
    onMenuToggle,
    userName = "Moni Roy",
    onLogout,
}: HeaderProps) {
    const router = useRouter()

    return (
        <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-border/70 bg-background/95 px-5 backdrop-blur-md sm:px-8">
            {/* Left Section: Brand Logo + Search */}
            <div className="flex items-center gap-4 lg:gap-8">
                {onMenuToggle && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuToggle}
                        className="lg:hidden"
                        aria-label="Toggle navigation menu"
                    >
                        <Menu className="size-5" />
                    </Button>
                )}

                <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold tracking-tight text-foreground">
                        CYL<span className="text-foreground">Stock</span>
                    </span>
                </div>

                <div className="relative hidden w-72 md:block lg:w-96">
                    <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search wholesale orders, products, buyers..."
                        className="h-10 rounded-xl border-border/80 bg-muted/40 pr-4 pl-10 text-xs shadow-none transition-all placeholder:text-muted-foreground focus-visible:bg-background"
                    />
                </div>
            </div>

            {/* Right Section: Theme Toggle + User Profile Dropdown */}
            <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle compact />

                <div className="h-6 w-px bg-border/80" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-3 rounded-xl p-1.5 pl-2 transition-colors hover:bg-muted/70"
                        >
                            <Avatar className="size-9 rounded-full border border-border">
                                <AvatarImage src="/meet.png" alt={userName} />
                                <AvatarFallback className="text-xs font-bold">
                                    {userName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <span className="hidden text-left sm:block">
                                <p className="text-xs font-bold text-foreground leading-tight">
                                    {userName}
                                </p>
                            </span>

                            <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                        <DropdownMenuLabel className="px-2 py-1.5">
                            <p className="text-sm font-semibold">{userName}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="cursor-pointer gap-2 rounded-lg"
                            onClick={() => router.push("/settings")}
                        >
                            <User className="size-4 text-blue-600" />
                            <span>My Profile</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className="cursor-pointer gap-2 rounded-lg"
                            onClick={() => router.push("/settings")}
                        >
                            <Settings className="size-4 text-blue-600" />
                            <span>Account Settings</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={onLogout}
                            className="cursor-pointer gap-2 rounded-lg text-rose-600 focus:text-rose-600 dark:text-rose-400"
                        >
                            <LogOut className="size-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
