import { NavLink, useNavigate } from "react-router-dom"
import { LogOut, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export function Sidebar({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: NavItem[]
}) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <aside style={{ width: 'var(--sidebar-width)' }} className="fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar">
      <div className="px-6 pt-6 pb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-amber">{title}</h1>
        <p className="text-xs font-medium text-sidebar-muted">{subtitle}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber text-sidebar shadow-sm"
                    : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
                )
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  )
}
