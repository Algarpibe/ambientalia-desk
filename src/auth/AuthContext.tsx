import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserPublic } from '../../shared/types'
import { authMe, authLogin, authLogout } from '../api/client'

interface AuthState {
  user: UserPublic | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() { setUser(await authMe()) }

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [])

  // Si una petición de datos recibe 401 (sesión expirada), volver al login.
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [])

  async function login(email: string, password: string) { setUser(await authLogin(email, password)) }
  async function logout() { await authLogout(); setUser(null) }

  return <AuthCtx.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
