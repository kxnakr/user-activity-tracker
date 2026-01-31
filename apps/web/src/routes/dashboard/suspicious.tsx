import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/dashboard/suspicious')({
  component: SuspiciousPage,
  context: () => ({
    dashboardMeta: {
      title: 'Suspicious Users',
      description:
        'Users flagged for high frequency actions or too many IP addresses.',
    },
  }),
})

type SuspiciousItem = {
  userId: string
  userName?: string | null
  reason: string
  count: number
}

function SuspiciousPage() {
  const { token } = useAuth()

  const suspiciousQuery = useQuery({
    queryKey: ['suspicious'],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<SuspiciousItem[]>(
        '/api/activity/suspicious',
        {},
        token ?? undefined,
      ),
  })

  return (
    <>
      {suspiciousQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : null}

        {suspiciousQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {getApiErrorMessage(suspiciousQuery.error)}
          </div>
        ) : null}

        {suspiciousQuery.data ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {suspiciousQuery.data.length === 0 ? (
              <p className="text-sm text-slate-500 text-pretty">
                No suspicious users detected in the recent windows.
              </p>
            ) : (
              <div className="space-y-3">
                {suspiciousQuery.data.map((item) => (
                  <div
                    key={`${item.userId}-${item.reason}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-pretty">
                          {item.reason}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums text-pretty">
                          User:{' '}
                          {item.userName
                            ? `${item.userName} (${item.userId})`
                            : item.userId}
                        </p>
                      </div>
                      <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 tabular-nums">
                        Count: {item.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
    </>
  )
}
