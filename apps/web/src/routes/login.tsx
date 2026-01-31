import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import PageShell from '@/components/PageShell'
import { useAuth } from '@/lib/auth'
import { apiRequest, getApiErrorMessage } from '@/lib/api'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

type AuthResponse = {
  token: string
  user: { id: string; name: string; email: string }
}

function LoginPage() {
  const navigate = useNavigate()
  const { setToken } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setToken(data.token)
      navigate({ to: '/dashboard' })
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    mutation.mutate({ email, password })
  }

  return (
    <PageShell
      title="Login"
      description="Authenticate to unlock the activity endpoints and analytics dashboards."
    >
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          {mutation.isError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 text-pretty">
              {getApiErrorMessage(mutation.error)}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mutation.isPending ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600 text-pretty">
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-slate-900">
            Register here
          </Link>
          .
        </p>
      </div>
    </PageShell>
  )
}
