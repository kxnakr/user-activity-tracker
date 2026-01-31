import { Link, useNavigate } from '@tanstack/react-router'
import {
  Activity,
  BarChart3,
  ShieldAlert,
  LogOut,
  Menu,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { to: '/dashboard/activity', label: 'Activity Simulator', icon: Activity },
  { to: '/dashboard/stats', label: 'Stats', icon: BarChart3 },
  { to: '/dashboard/suspicious', label: 'Suspicious Users', icon: ShieldAlert },
]

export default function DashboardLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const { setToken } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    setToken('')
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="flex min-h-dvh w-full flex-col md:flex-row">
        <aside className="hidden w-full border-r border-slate-200 bg-white px-6 py-8 md:block md:w-64">
          <div className="flex h-full flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 text-pretty">
                User Activity Tracker
              </p>
              <p className="mt-2 text-lg font-semibold text-balance">
                Control Center
              </p>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'block rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-slate-700 transition-colors',
                    'hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900',
                  )}
                  activeProps={{
                    className:
                      'block rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 hover:text-white',
                  }}
                >
                  <span className="flex items-center gap-2">
                    <item.icon size={16} />
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-balance">{title}</h1>
              <p className="text-sm text-slate-600 text-pretty">{description}</p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open menu"
                    className="flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 md:hidden"
                  >
                    <Menu size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link to={item.to} className="flex items-center gap-2">
                        <item.icon size={16} />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <button type="button" onClick={handleLogout} className="flex items-center gap-2">
                      <LogOut size={16} />
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white md:inline-flex"
              >
                Logout
              </button>
            </div>
          </header>
          <main className="px-6 py-8">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
