import type { User } from "@/store/auth/auth.types"
import api from "../axios"
import { API_ENDPOINTS } from "../endpoints"
import type { ApiResponse } from "../types"

type RegisterPayload = {
     email: string
     phone: string
     password: string
}

type LoginPayload = {
     email: string
     password: string
}

type PasswordResetPayload = {
     email: string
}

type PasswordResetConfirmPayload = {
     uid: string
     token: string
     new_password: string
}

export const authUserService = {
     async userRegister(payload: RegisterPayload): Promise<ApiResponse<User>> {
          const response = await api.post<User>(API_ENDPOINTS.USER_REGISTRATION, payload)
          return {
               data: response.data,
               status: response.status,
          }
     },

     async userLogin(payload: LoginPayload): Promise<ApiResponse<User>> {
          const response = await api.post<{ access: string; refresh: string }>(API_ENDPOINTS.USER_LOGIN, payload)
          if (typeof window !== "undefined") {
               window.localStorage.setItem("access_token", response.data.access)
               window.localStorage.setItem("refresh_token", response.data.refresh)
          }
          return {
               data: response.data as unknown as User,
               status: response.status,
          }
     },

     async requestPasswordReset(payload: PasswordResetPayload) {
          const response = await api.post(API_ENDPOINTS.USER_PASSWORD_RESET, payload)
          return {
               data: response.data,
               status: response.status,
          }
     },

     async confirmPasswordReset(payload: PasswordResetConfirmPayload) {
          const response = await api.post(API_ENDPOINTS.USER_PASSWORD_RESET_CONFIRM, payload)
          return {
               data: response.data,
               status: response.status,
          }
     },

     async refreshAccessToken() {
          const refresh = typeof window !== "undefined" ? window.localStorage.getItem("refresh_token") : null
          if (!refresh) throw new Error("No refresh token")
          const response = await api.post<{ access: string }>(API_ENDPOINTS.USER_TOKEN_REFRESH, { refresh })
          if (typeof window !== "undefined") window.localStorage.setItem("access_token", response.data.access)
          return {
               data: response.data,
               status: response.status,
          }
     },

     async logOut() {
          if (typeof window !== "undefined") {
               window.localStorage.removeItem("access_token")
               window.localStorage.removeItem("refresh_token")
          }
          return {
               data: { detail: "Logged out" },
               status: 204,
          }
     },
}
