import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { Navigate } from 'react-router-dom'

import { auth } from '@/lib/firebase'
import { apiFetchWithToken } from '@/lib/api'

type AuthContextValue = {
  user: User | null
  initializing: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
  getToken: () => Promise<string | null>
  apiFetchAuth: (path: string, options?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setInitializing(true)
      setUser(nextUser)
      if (nextUser) {
        try {
          const token = await nextUser.getIdToken()
          const response = await apiFetchWithToken('/api/admin/me', token)
          setIsAdmin(response.ok)
        } catch {
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setInitializing(false)
    })
    return () => unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const getToken = useCallback(async (forceRefresh = false) => {
    if (!auth.currentUser) return null
    return auth.currentUser.getIdToken(forceRefresh)
  }, [])

  const logOut = useCallback(async () => {
    await signOut(auth)
    setIsAdmin(false)
  }, [])

  const apiFetchAuth = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = await getToken()
    if (!token) throw new Error('Missing auth token')

    const response = await apiFetchWithToken(path, token, options)

    if (response.status !== 401) return response

    // Token may be stale — force-refresh and retry once
    try {
      const freshToken = await getToken(true)
      if (!freshToken) throw new Error('No token after refresh')
      const retried = await apiFetchWithToken(path, freshToken, options)
      if (retried.status !== 401) return retried
    } catch {
      // refresh failed — fall through to sign-out
    }

    // Session is dead — sign out and send to login
    await signOut(auth)
    setIsAdmin(false)
    window.location.replace('/login')
    throw new Error('Session expired. Please sign in again.')
  }, [getToken])

  const value = useMemo(
    () => ({ user, initializing, isAdmin, signIn, logOut, getToken, apiFetchAuth }),
    [user, initializing, isAdmin, signIn, logOut, getToken, apiFetchAuth]
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
  const { user, initializing, isAdmin } = useAuth()

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Access denied. This account does not have admin privileges.
      </div>
    )
  }

  return <>{children}</>
}
