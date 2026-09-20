import api from "@/api/axios"

export type Product = {
    uuid: string;
    name: string;
    brand: string;
    brand_name: string;
    unit: string;
    unit_name?: string;
    buying_price: string;
    selling_price: string;
    description?: string;
    is_active: boolean;
}
export type ProductPayload = {
    name: string;
    brand: string;
    unit: string;
    buying_price: string;
    selling_price: string;
    description?: string;
    is_active?: boolean;
}

export const productService = {
    async list() {
        const response = await api.get<{ results: Product[] }>("products/");
        return response.data.results ?? []
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
