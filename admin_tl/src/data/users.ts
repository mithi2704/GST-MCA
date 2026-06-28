export type UserRole = "Super Admin" | "Team Lead"
export type UserStatus = "Active" | "Inactive"

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastLogin: string
}

export const adminUsers: AdminUser[] = []
