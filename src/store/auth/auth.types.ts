export type User = {
     uuid: string,
     firstName: string
     lastName: string
     username: string 
     email: string 
     phone: string 
     isActive: boolean
     isAdmin: boolean
     isStaff: boolean
     role: string
}

export type UserMeResponse = {
     id?: number
     uuid: string
     first_name: string
     last_name: string
     email: string
     phone: string 
     username: string 
     is_active: boolean
     is_admin: boolean
     is_staff: boolean
     is_superuser: boolean
     role: string
     date_joined?: string
}

export type AccountActivation = {
     uid: string
     token: string
}
