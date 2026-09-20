import axios from "axios"
import { API_ENDPOINTS } from "./endpoints"

const api = axios.create({
     baseURL: API_ENDPOINTS.API_ROOT,
     headers: { "Content-Type": "application/json" },
     withCredentials: true,
})

api.interceptors.response.use(
     (response) => response,
     async (error) => {
          const originalRequest = error.config as typeof error.config & { _retry?: boolean }
          const isUnauthorized = error.response?.status === 401
          const isRefreshCall = originalRequest?.url?.includes(API_ENDPOINTS.USER_TOKEN_REFRESH)

          if (isUnauthorized && !originalRequest?._retry && !isRefreshCall) {
               originalRequest._retry = true

               try {
                    const refresh = window.localStorage.getItem("refresh_token")
                    if (!refresh) throw new Error("No refresh token")
                    const response = await api.post<{ access: string }>(API_ENDPOINTS.USER_TOKEN_REFRESH, { refresh })
                    window.localStorage.setItem("access_token", response.data.access)
                    originalRequest.headers = originalRequest.headers ?? {}
                    originalRequest.headers.Authorization = `JWT ${response.data.access}`
                    return api(originalRequest)
               } catch (refreshError) {
                    try {
                         window.localStorage.removeItem("access_token")
                         window.localStorage.removeItem("refresh_token")
                    } catch {
                         // Ignore logout failures and still force the user back to login.
                    }

                    if (typeof window !== "undefined") {
                         window.location.replace("/login?reason=session-expired")
                    }

                    return Promise.reject(refreshError)
               }
          }

          return Promise.reject(error)
     }
)

api.interceptors.request.use((config) => {
     if (typeof window !== "undefined") {
          const token = window.localStorage.getItem("access_token")
          if (token) config.headers.Authorization = `JWT ${token}`
     }
     return config
})

export default api
