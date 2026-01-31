import { createFileRoute, Link } from '@tanstack/react-router'

import PageShell from '@/components/PageShell'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/')({
  component: Landing,
})

function Landing() {
  const { token } = useAuth()

  return (
    <PageShell title="" description="">
      <div className="flex flex-col items-center text-center mt-20">
        <h2 className="text-4xl font-semibold text-balance md:text-5xl">
          User Activity Tracker
        </h2>
        <p className="mt-4 max-w-2xl text-base text-slate-600 text-pretty md:text-lg">
          Monitor user actions, catch suspicious behavior, and validate replay
          protection in one place.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {token ? (
            <Link
              to="/dashboard"
              className="rounded-full border border-slate-900 bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-900 bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </PageShell>
  )
}
