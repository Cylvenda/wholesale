"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const THEME_STORAGE_KEY = "community-hub-theme"

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light"
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme
  }

  return "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")

  useEffect(() => {
    const initialTheme = getInitialTheme()
    const frame = window.requestAnimationFrame(() => {
      setThemeState(initialTheme)
      applyTheme(initialTheme)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
    applyTheme(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const themeScript = `
  (function () {
    try {
      var storageKey = "${THEME_STORAGE_KEY}";
      var storedTheme = window.localStorage.getItem(storageKey);
      var resolvedTheme = storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : "light";

      if (resolvedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (error) {
      document.documentElement.classList.remove("dark");
    }
  })();
`

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
