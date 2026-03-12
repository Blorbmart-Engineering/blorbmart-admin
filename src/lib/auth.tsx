import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'

import { auth } from '@/lib/firebase'
import { apiFetch, apiFetchWithToken } from '@/lib/api'

type AuthContextValue = {
  user: User | null
  loading: boolean
  isAdmin: boolean
  adminLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
  getToken: () => Promise<string | null>
  apiFetchAuth: (path: string, options?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)

  const checkAdmin = useCallback(async (currentUser: User) => {
    setAdminLoading(true)
    try {
      const token = await currentUser.getIdToken()
      const response = await apiFetchWithToken('/api/admin/me', token)
      if (response.ok) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    } catch {
      setIsAdmin(false)
    } finally {
      setAdminLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
      if (nextUser) {
        checkAdmin(nextUser)
      } else {
        setIsAdmin(false)
      }
    })
    return () => unsubscribe()
  }, [checkAdmin])

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const getToken = useCallback(async () => {
    if (!auth.currentUser) return null
    return auth.currentUser.getIdToken()
  }, [])

  const apiFetchAuth = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = await getToken()
    if (!token) {
      throw new Error('Missing auth token')
    }
    return apiFetchWithToken(path, token, options)
  }, [getToken])

  const logOut = useCallback(async () => {
    await signOut(auth)
    setIsAdmin(false)
  }, [])

  const value = useMemo(
    () => ({ user, loading, isAdmin, adminLoading, signIn, logOut, getToken, apiFetchAuth }),
    [user, loading, isAdmin, adminLoading, signIn, logOut, getToken, apiFetchAuth]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, adminLoading } = useAuth()

  if (loading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking access...
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Access denied.
      </div>
    )
  }

  return <>{children}</>
}
