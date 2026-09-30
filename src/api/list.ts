import api from "./axios"

type PaginatedResponse<T> = {
     next?: string | null
     results?: T[]
}

export async function fetchAll<T>(endpoint: string): Promise<T[]> {
     const items: T[] = []
     const visited = new Set<string>()
     let next: string | null = endpoint

     while (next && !visited.has(next)) {
          visited.add(next)
          const response: { data: T[] | PaginatedResponse<T> } =
               await api.get<T[] | PaginatedResponse<T>>(next)

          if (Array.isArray(response.data)) {
               items.push(...response.data)
               break
          }

          items.push(...(response.data.results ?? []))
          next = response.data.next ?? null
     }

     return items
}