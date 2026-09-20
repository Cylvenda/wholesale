import type { AccountActivation, UserMeResponse } from "@/store/auth/auth.types"
import api from "../axios"
import { API_ENDPOINTS } from "../endpoints"

export type UserRole = "admin" | "manager" | "salesperson" | "storekeeper" | "accountant"

export type UserAdminResponse = UserMeResponse & {
     role: UserRole
     is_active: boolean
     is_staff: boolean
     is_superuser: boolean
}

export type UserAdminPayload = {
     email: string
     phone: string
     first_name: string
     last_name: string
     password?: string
     role: UserRole
     is_active: boolean
}

export const userServices = {

     async getUserMe() {
          const response = await api.get<UserMeResponse>(API_ENDPOINTS.CURRENT_USER_PROFILE)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async updateUserMe(payload: Partial<UserMeResponse>) {
          const response = await api.patch<UserMeResponse>(API_ENDPOINTS.CURRENT_USER_PROFILE, payload)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async changePassword(payload: { current_password: string; new_password: string }) {
          const response = await api.post(API_ENDPOINTS.USER_PASSWORD_CHANGE, payload)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async emailActivation(payload: string) {
          const response = await api.post(API_ENDPOINTS.USER_RESEND_ACTIVATION_EMAIL, { email: payload })
          return {
               status: response.status,
               data: response.data
          }
     },

     async accountActivation(payload: AccountActivation) {
          const response = await api.post(API_ENDPOINTS.USER_ACCOUNT_ACTIVATION, payload)
          return {
               status: response.status,
               data: response.data
          }
     },

     async listUsers(): Promise<UserAdminResponse[]> {
          const response = await api.get(API_ENDPOINTS.USER_MANAGEMENT)
          return Array.isArray(response.data)
              ? response.data
              : response.data.results ?? []
     },

     async getUser(uuid: string): Promise<UserAdminResponse> {
          const response = await api.get<UserAdminResponse>(`${API_ENDPOINTS.USER_MANAGEMENT}${uuid}/`)
          return response.data
     },

     async createUser(payload: UserAdminPayload) {
          const response = await api.post<UserAdminResponse>(API_ENDPOINTS.USER_MANAGEMENT, payload)
          return response.data
     },

     async updateUser(uuid: string, payload: Partial<UserAdminPayload>) {
          const response = await api.patch<UserAdminResponse>(`${API_ENDPOINTS.USER_MANAGEMENT}${uuid}/`, payload)
          return response.data
     },

     async deleteUser(uuid: string) {
          const response = await api.delete(`${API_ENDPOINTS.USER_MANAGEMENT}${uuid}/`)
          return response.status
     },
}
