const apiRootFromEnv = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api/"


export const API_ENDPOINTS = {
     // root api endpoint
     API_ROOT: apiRootFromEnv,

      // User Authentication Endpoints
      USER_REGISTRATION: "auth/users/",
      USER_LOGIN: "auth/jwt/create/",
      USER_TOKEN_REFRESH: "auth/jwt/refresh/",
      USER_TOKEN_VERIFY: "auth/jwt/verify/",
      USER_LOGOUT: "auth/token/logout/",


      // Current user
      CURRENT_USER_PROFILE: "auth/users/me/",
      USER_PASSWORD_RESET: "auth/users/reset_password/",
      USER_PASSWORD_RESET_CONFIRM: "auth/users/reset_password_confirm/",
      USER_RESEND_ACTIVATION_EMAIL: "auth/users/resend_activation/",
      USER_ACCOUNT_ACTIVATION: "auth/users/activation/",
      USER_PASSWORD_CHANGE: "auth/users/set_password/",

      // User management (admin)
      USER_MANAGEMENT: "users/",

      // Notifications
      NOTIFICATIONS: "notifications/",
}
