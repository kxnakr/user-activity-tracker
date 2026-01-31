import { createContext, useContext, useMemo, useState } from 'react'

type AuthState = {
  token: string
  setToken: (next: string) => void
}

const TOKEN_KEY = 'uat_token'

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState(() =>
    typeof window === 'undefined' ? '' : localStorage.getItem(TOKEN_KEY) ?? '',
  )

  const setToken = (next: string) => {
    setTokenState(next)
    if (typeof window === 'undefined') return
    if (next) {
      localStorage.setItem(TOKEN_KEY, next)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  const value = useMemo(() => ({ token, setToken }), [token, setToken])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
