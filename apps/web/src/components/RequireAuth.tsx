import { Navigate } from '@tanstack/react-router'

import { useAuth } from '@/lib/auth'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
