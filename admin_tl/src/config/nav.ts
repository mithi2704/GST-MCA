import {
  LayoutGrid,
  BadgePercent,
  IdCard,
  Users,
  ListChecks,
  BarChart3,
  Building2,
  ClipboardList,
  MapPin,
  Settings,
} from "lucide-react"
import type { NavItem } from "@/components/layout/Sidebar"

export const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutGrid, end: true },
  { label: "Incentives", to: "/incentives", icon: BadgePercent },
  { label: "Employees", to: "/employees", icon: Users },
  { label: "Clients", to: "/clients", icon: Building2 },
  { label: "Tasks", to: "/tasks", icon: ListChecks },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
]

export const leadNav: NavItem[] = [
  { label: "Dashboard", to: "/lead", icon: LayoutGrid, end: true },
  { label: "Employees", to: "/lead/employees", icon: IdCard },
  { label: "Clients", to: "/lead/clients", icon: Users },
  { label: "Task Assigning", to: "/lead/tasks", icon: ClipboardList },
  { label: "Employee Tracking", to: "/lead/tracking", icon: MapPin },
  { label: "Analytics", to: "/lead/analytics", icon: BarChart3 },
  { label: "Incentives", to: "/lead/incentives", icon: BadgePercent },
  { label: "Settings", to: "/lead/settings", icon: Settings },
]
