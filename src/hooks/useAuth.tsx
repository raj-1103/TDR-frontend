'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { UserSession } from '@/lib/api'

interface AuthCtx {
  user: UserSession | null
  setUser: (u: UserSession | null) => void
  logout: () => void
  initializing: boolean
}

const Ctx = createContext<AuthCtx>({ user: null, setUser: () => {}, logout: () => {}, initializing: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserSession | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('tdr_session')
    if (stored) {
      try { 
        setUserState(JSON.parse(stored)) 
      } catch (e) {
        localStorage.removeItem('tdr_session')
      }
    }
    setInitializing(false)
  }, [])

  const setUser = (u: UserSession | null) => {
    setUserState(u)
    if (u) localStorage.setItem('tdr_session', JSON.stringify(u))
    else localStorage.removeItem('tdr_session')
  }

  const logout = () => setUser(null)

  return <Ctx.Provider value={{ user, setUser, logout, initializing }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
