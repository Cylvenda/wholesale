import api from "@/api/axios"
import { fetchAll } from "@/api/list"
import type { Product, ProductPayload } from "@/api/types"

export type { Product, ProductPayload } from "@/api/types"

export const productService = {
    async list() {
        return fetchAll<Product>("products/")
    },
    async get(uuid: string) {
        const response = await api.get<Product>(`products/${uuid}/`)
        return response.data
    },
    async create(payload: ProductPayload) {
        const response = await api.post<Product>("products/", payload);
        return response.data
    },
    async update(uuid: string, payload: ProductPayload) {
        const response = await api.patch<Product>(`products/${uuid}/`, payload)
        return response.data
    },
    async delete(uuid: string) {
        await api.delete(`products/${uuid}/`)
    },
}