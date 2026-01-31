import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

import DashboardLayout from '@/components/DashboardLayout'
import RequireAuth from '@/components/RequireAuth'

export const Route = createFileRoute('/dashboard')({
  component: DashboardShell,
})

function DashboardShell() {
  const dashboardMeta = useRouterState({
    select: (state) => {
      const match = [...state.matches]
        .reverse()
        .find((entry) => entry.context.dashboardMeta)
      return match?.context.dashboardMeta ?? {}
    },
    structuralSharing: false,
  })

  return (
    <RequireAuth>
      <DashboardLayout
        title={dashboardMeta.title ?? 'Dashboard'}
        description={dashboardMeta.description ?? ''}
      >
        <Outlet />
      </DashboardLayout>
    </RequireAuth>
  )
}
