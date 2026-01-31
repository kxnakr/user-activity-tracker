import { Link, useNavigate } from '@tanstack/react-router'

import { useAuth } from '@/lib/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const menuItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/activity', label: 'Activity Simulator' },
  { to: '/dashboard/stats', label: 'Stats' },
  { to: '/dashboard/suspicious', label: 'Suspicious Users' },
]

export default function Header() {
  const { token, setToken } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    setToken('')
    navigate({ to: '/' })
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="text-lg font-semibold text-balance">
          User Activity Tracker
        </Link>

        <div className="flex items-center gap-2">
          {token ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Dashboard
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Menu
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  {menuItems.map((item) => (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link to={item.to}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <button type="button" onClick={handleLogout}>
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
