import { Link } from '@tanstack/react-router'

import { useAuth } from '@/lib/auth'

export default function AuthGate({
  children,
  message,
}: {
  children: React.ReactNode
  message: string
}) {
  const { token } = useAuth()

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 text-pretty shadow-sm">
        <p className="text-pretty">{message}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Register
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
