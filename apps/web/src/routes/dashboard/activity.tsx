import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { apiRequest, getApiErrorMessage, type ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useInterval } from '@/lib/useInterval'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/activity')({
  component: ActivityPage,
  context: () => ({
    dashboardMeta: {
      title: 'Activity Simulator',
      description:
        'Send actions, test the 5-in-10s rule, and observe replay protection behavior.',
    },
  }),
})

type ActivityResponse = {
  success: boolean
  serverTime: string
  actionsInLast10Sec: number
}

type ReplayResponse = {
  allowed: boolean
  serverTime: string
  message?: string
  driftMs?: number
}

const actions = ['login', 'logout', 'view', 'click', 'custom'] as const

const formatTimestamp = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const hour = String(hours).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minutes}:${seconds} ${ampm}`
}

function ActivityPage() {
  const { token } = useAuth()
  const [enableReplayCheck, setEnableReplayCheck] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem('uat_rate_limit_until')
    const parsed = stored ? Number(stored) : Number.NaN
    return Number.isFinite(parsed) ? parsed : null
  })
  const [lastReplay, setLastReplay] = useState<{
    clientTime: string
    serverTime: string
    driftMs: number
    allowed: boolean
    message?: string
  } | null>(null)
  const [lastActivity, setLastActivity] = useState<ActivityResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  useInterval(() => {
    const current = Date.now()
    setNow(current)
    if (cooldownUntil && current >= cooldownUntil) {
      setCooldownUntil(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('uat_rate_limit_until')
      }
    }
  }, 1000)

  const cooldownRemaining = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
    : 0

  const disableActions = isSending || cooldownRemaining > 0

  const setRateLimitUntil = (timestamp: number) => {
    setCooldownUntil(timestamp)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('uat_rate_limit_until', String(timestamp))
    }
  }

  const handleAction = async (action: (typeof actions)[number]) => {
    if (!token) return

    setIsSending(true)
    setErrorMessage(null)

    const clientTime = new Date().toISOString()
    try {
      if (enableReplayCheck) {
        try {
          const replay = await apiRequest<ReplayResponse>(
            '/api/activity/replay-check',
            {
              method: 'POST',
              body: JSON.stringify({ action, clientTime }),
            },
            token,
          )

          const driftMs = Math.abs(
            new Date(replay.serverTime).getTime() -
              new Date(clientTime).getTime(),
          )

          setLastReplay({
            clientTime,
            serverTime: replay.serverTime,
            driftMs,
            allowed: replay.allowed,
            message: replay.message,
          })

          if (!replay.allowed) {
            setIsSending(false)
            return
          }
        } catch (error) {
          const apiError = error as ApiError
          const details = apiError.details as
            | { serverTime?: string; driftMs?: number }
            | undefined
          const serverTime = details?.serverTime ?? new Date().toISOString()
          const driftMs =
            details?.driftMs ??
            Math.abs(new Date(serverTime).getTime() - new Date(clientTime).getTime())

          setLastReplay({
            clientTime,
            serverTime,
            driftMs,
            allowed: false,
            message: apiError.message,
          })
          setErrorMessage(getApiErrorMessage(apiError))
          setIsSending(false)
          return
        }
      }

      const activity = await apiRequest<ActivityResponse>(
        '/api/activity',
        {
          method: 'POST',
          body: JSON.stringify({ action, meta: { source: 'simulator' } }),
        },
        token,
      )

      setLastActivity(activity)
      setIsSending(false)
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(getApiErrorMessage(apiError))

      if (apiError.status === 429 && apiError.details) {
        const serverTime = (apiError.details as { serverTime?: string }).serverTime
        if (serverTime) {
          const base = new Date(serverTime).getTime()
          setRateLimitUntil(base + 10_000)
        } else {
          setRateLimitUntil(Date.now() + 10_000)
        }
      }

      setIsSending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-balance">Action console</h2>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={enableReplayCheck}
                  onChange={(event) => setEnableReplayCheck(event.target.checked)}
                  className="size-4 rounded border-slate-300"
                />
                Run replay check first
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={disableActions}
                  onClick={() => handleAction(action)}
                  className={cn(
                    'rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-semibold text-slate-800 transition-colors',
                    'hover:bg-slate-100',
                    disableActions && 'cursor-not-allowed opacity-70',
                  )}
                >
                  <span className="block text-sm uppercase text-slate-500">
                    Action
                  </span>
                  <span className="mt-1 block text-lg font-semibold capitalize">
                    {action}
                  </span>
                </button>
              ))}
            </div>

            {isSending ? (
              <p className="mt-3 text-sm text-slate-500 text-pretty">
                Sending action...
              </p>
            ) : null}

            {cooldownRemaining > 0 ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Rate limit hit. Try again in a few seconds.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-balance">Replay check</h3>
              {isSending && !lastReplay ? (
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-48 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-44 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                </div>
              ) : lastReplay ? (
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p className="text-pretty">
                    Status:{' '}
                    <span
                      className={cn(
                        'font-semibold',
                        lastReplay.allowed ? 'text-emerald-700' : 'text-rose-700',
                      )}
                    >
                      {lastReplay.allowed ? 'Allowed' : 'Rejected'}
                    </span>
                  </p>
                  <p className="tabular-nums text-pretty">
                    Server time: {formatTimestamp(lastReplay.serverTime)}
                  </p>
                  <p className="tabular-nums text-pretty">
                    Client time: {formatTimestamp(lastReplay.clientTime)}
                  </p>
                  <p className="tabular-nums text-pretty">
                    Server vs client difference:{' '}
                    {Math.round(lastReplay.driftMs / 1000)}s
                  </p>
                  {lastReplay.message ? (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 text-pretty">
                      {lastReplay.message}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500 text-pretty">
                  Replay checks will appear here after you send an action.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-balance">Latest activity</h3>
              {isSending && !lastActivity ? (
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-52 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                </div>
              ) : lastActivity ? (
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p className="tabular-nums text-pretty">
                    Server time: {formatTimestamp(lastActivity.serverTime)}
                  </p>
                  <p className="tabular-nums text-pretty">
                    Actions in last 10s: {lastActivity.actionsInLast10Sec}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500 text-pretty">
                  Activity responses will show up after you log an action.
                </p>
              )}
            </div>
          </section>
    </div>
  )
}
