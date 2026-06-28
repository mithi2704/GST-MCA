import { createContext, useContext, useState, useCallback } from 'react'
import { authService } from '@/services/authService'

interface SessionUser {
  name: string
  role: string
  email: string
  avatar: string | null
  token?: string
}

interface AuthContextValue {
  user: SessionUser | null
  login: (credentials: { email: string; password: string }) => Promise<SessionUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'teamlead_session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as SessionUser) : null
  })

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }
    
    // Connect to real backend service
    const response = await authService.login({ email, password })
    
    // Structure of successful response containing token and user info
    const rawRole = response.user?.role || response.role;
    const roleMap: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'TEAM_LEAD': 'Team Lead',
      'EMPLOYEE': 'Employee',
      'Super Admin': 'Super Admin',
      'Team Lead': 'Team Lead',
      'Employee': 'Employee'
    };
    const sessionUser: SessionUser = {
      name: response.user?.name || response.name || 'User',
      role: roleMap[rawRole] || (email.includes('admin') ? 'Super Admin' : 'Team Lead'),
      email: response.user?.email || response.email || email,
      avatar: response.user?.avatar || response.avatar || null,
      token: response.token,
    }
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)
    return sessionUser;
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (_) {
      // Allow local session cleanup even if request fails
    } finally {
      sessionStorage.removeItem(STORAGE_KEY)
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
