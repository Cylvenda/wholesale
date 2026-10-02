import axios from "axios"

type ErrorRecord = Record<string, unknown>

function collectMessages(value: unknown): string[] {
     if (typeof value === "string") return value.trim() ? [value.trim()] : []
     if (Array.isArray(value)) return value.flatMap(collectMessages)
     if (!value || typeof value !== "object") return []

     const record = value as ErrorRecord
     const prioritized = ["detail", "message", "non_field_errors", "error"]
          .flatMap((key) => collectMessages(record[key]))
     const remaining = Object.entries(record)
          .filter(([key]) => !["detail", "message", "non_field_errors", "error", "success"].includes(key))
          .flatMap(([, nested]) => collectMessages(nested))

     return [...prioritized, ...remaining]
}

function messageFromPayload(payload: unknown, fallback: string): string {
     const messages = collectMessages(payload)
     return messages.length ? [...new Set(messages)].join(" ") : fallback
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
     if (!axios.isAxiosError(error)) {
          return error instanceof Error && error.message ? error.message : fallback
     }

     const payload: unknown = error.response?.data
     if (typeof Blob !== "undefined" && payload instanceof Blob) return fallback
     return messageFromPayload(payload, fallback)
}

export async function getApiErrorMessageAsync(
     error: unknown,
     fallback: string
): Promise<string> {
     if (!axios.isAxiosError(error)) return getApiErrorMessage(error, fallback)

     const payload: unknown = error.response?.data
     if (typeof Blob !== "undefined" && payload instanceof Blob) {
          const text = await payload.text()
          try {
               return messageFromPayload(JSON.parse(text), fallback)
          } catch {
               return text.trim() || fallback
          }
     }

     return messageFromPayload(payload, fallback)
}
