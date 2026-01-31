import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useInterval } from '@/lib/useInterval'

export const Route = createFileRoute('/dashboard/stats')({
  component: StatsPage,
  context: () => ({
    dashboardMeta: {
      title: 'Activity Stats',
      description:
        'Live analytics for the last 10 minutes, auto-refreshing every 5 seconds.',
    },
  }),
})

type StatsResponse = {
  serverTime: string
  totalActions: number
  mostCommonAction: string | null
  mostCommonActionCount: number
  actionsPerMinuteLast10Min: { minute: string; count: number }[]
  mostActiveUser: string | null
  mostActiveUserName: string | null
  mostActiveUserEmail: string | null
  mostActiveUserCount: number
}

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

function StatsPage() {
  const { token } = useAuth()

  const statsQuery = useQuery({
    queryKey: ['stats'],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<StatsResponse>('/api/activity/stats', {}, token ?? undefined),
  })

  useInterval(() => {
    if (token) {
      statsQuery.refetch()
    }
  }, 5000)

  return (
    <>
      {statsQuery.isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {statsQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {getApiErrorMessage(statsQuery.error)}
          </div>
        ) : null}

        {statsQuery.data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <StatCard
                label="Total actions"
                value={statsQuery.data.totalActions.toLocaleString()}
              />
              <StatCard
                label="Most common action"
                value={statsQuery.data.mostCommonAction ?? 'N/A'}
                subValue={`${statsQuery.data.mostCommonActionCount} events`}
              />
              <StatCard
                label="Most active user"
                value={
                  statsQuery.data.mostActiveUserName ??
                  statsQuery.data.mostActiveUserEmail ??
                  statsQuery.data.mostActiveUser ??
                  'N/A'
                }
                subValue={`${statsQuery.data.mostActiveUserCount} events`}
              />
              <StatCard
                label="Server time"
                value={formatTimestamp(statsQuery.data.serverTime)}
              />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-balance">
                  Actions per minute (last 10 minutes)
                </h2>
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Auto refresh
                </span>
              </div>
              {statsQuery.data.actionsPerMinuteLast10Min.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 text-pretty">
                  No recent activity. Log a few actions to see this chart fill in.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {statsQuery.data.actionsPerMinuteLast10Min.map((entry) => (
                    <div
                      key={entry.minute}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-700">
                        {new Date(entry.minute).toLocaleTimeString()}
                      </span>
                      <span className="tabular-nums font-semibold text-slate-900">
                        {entry.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
    </>
  )
}

function StatCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500 text-pretty">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums text-pretty">
        {value}
      </p>
      {subValue ? (
        <p className="mt-1 text-xs text-slate-500 tabular-nums text-pretty">
          {subValue}
        </p>
      ) : null}
    </div>
  )
}
