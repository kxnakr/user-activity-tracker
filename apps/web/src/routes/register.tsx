import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import PageShell from '@/components/PageShell'
import { useAuth } from '@/lib/auth'
import { apiRequest, getApiErrorMessage } from '@/lib/api'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

type AuthResponse = {
  token: string
  user: { id: string; name: string; email: string }
}

function RegisterPage() {
  const navigate = useNavigate()
  const { setToken } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      apiRequest<AuthResponse>('/api/auth/register', {
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
    mutation.mutate({ name, email, password })
  }

  return (
    <PageShell
      title="Register"
      description="Create a new account to start logging user activity events."
    >
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Alex Carter"
              required
            />
          </div>

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
              autoComplete="new-password"
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
            {mutation.isPending ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600 text-pretty">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-slate-900">
            Sign in
          </Link>
          .
        </p>
      </div>
    </PageShell>
  )
}
