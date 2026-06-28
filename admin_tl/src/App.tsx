import { Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { adminNav, leadNav } from "@/config/nav"
import ProtectedRoute from "@/routes/ProtectedRoute"

// Auth pages
import Login from "@/pages/Login"
import CreateAccount from "@/pages/CreateAccount"
import NotFound from "@/pages/NotFound"

// Admin pages
import Dashboard from "@/pages/admin/Dashboard"
import AdminClients from "@/pages/admin/Clients"
import AdminClientDetail from "@/pages/admin/ClientDetail"
import AdminOnboardClient from "@/pages/admin/OnboardClient"
import AdminEmployees from "@/pages/admin/Employees"
import AdminTasks from "@/pages/admin/Tasks"
import AdminEmployeeDetail from "@/pages/admin/EmployeeDetail"
import AdminTaskDetail from "@/pages/admin/TaskDetail"
import AdminIncentives from "@/pages/admin/Incentives"
import AdminAnalytics from "@/pages/admin/Analytics"
import AdminAuditLog from "@/pages/admin/AuditLog"
import AdminClientAllocation from "@/pages/admin/ClientAllocation"
import ManageAllocation from "@/pages/admin/ManageAllocation"
import AdminEmployeeOnboard from "@/pages/admin/EmployeeOnboarding"
import AdminCreateTask from "@/pages/admin/CreateTask"

// Lead pages (ported from JS project)
import LeadDashboard from "@/pages/lead/Dashboard"
import LeadEmployeeTracking from "@/pages/lead/EmployeeTracking"
import LeadReports from "@/pages/lead/Reports"
import LeadIncentive from "@/pages/lead/Incentive"
import LeadSettings from "@/pages/lead/Settings"
import LeadTaskAssigning from "@/pages/lead/TaskAssigning"
import LeadEmployees from "@/pages/lead/Employees"
import LeadClients from "@/pages/lead/Clients"

// Lazy-loaded admin pages
const AdminEmployeeEdit = lazy(() => import("@/pages/admin/EditEmployeePage"))

function AdminLayout() {
  const { user } = useAuth()
  if (user && user.role === "Team Lead") {
    return <Navigate to="/lead" replace />
  }
  return (
    <ProtectedRoute>
      <AppLayout 
        navItems={adminNav} 
        userName={user?.name ?? "Super Admin"} 
        userRole={user?.role ?? "Global Access"} 
      />
    </ProtectedRoute>
  )
}

function LeadLayout() {
  const { user } = useAuth()
  if (user && user.role !== "Team Lead") {
    return <Navigate to="/dashboard" replace />
  }
  return (
    <ProtectedRoute>
      <AppLayout
        navItems={leadNav}
        userName={user?.name ?? "Vikram Sharma"}
        userRole={user?.role ?? "Team Lead"}
        searchPlaceholder="Search your team, clients, or tasks..."
        sidebarTitle="Team Lead Console"
        sidebarSubtitle="Team Lead Portal"
      />
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<CreateAccount />} />

        {/* Admin routes — protected */}
        <Route path="/dashboard" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
        </Route>

        <Route path="/incentives" element={<AdminLayout />}>
          <Route index element={<AdminIncentives />} />
        </Route>

        <Route path="/employees" element={<AdminLayout />}>
          <Route index element={<AdminEmployees />} />
          <Route path="add" element={<AdminEmployeeOnboard />} />
          <Route path=":id" element={<AdminEmployeeDetail />} />
          <Route path=":id/edit" element={<Suspense fallback={<div />}><AdminEmployeeEdit /></Suspense>} />
        </Route>

        <Route path="/clients" element={<AdminLayout />}>
          <Route index element={<AdminClients />} />
          <Route path="add" element={<AdminOnboardClient />} />
          <Route path=":id" element={<AdminClientDetail />} />
        </Route>

        <Route path="/client-allocation" element={<AdminLayout />}>
          <Route index element={<AdminClientAllocation />} />
        </Route>

        <Route path="/clients/:id/manage-allocation" element={<AdminLayout />}>
          <Route index element={<ManageAllocation />} />
        </Route>

        <Route path="/tasks" element={<AdminLayout />}>
          <Route index element={<AdminTasks />} />
          <Route path="create" element={<AdminCreateTask />} />
          <Route path=":id" element={<AdminTaskDetail />} />
        </Route>

        <Route path="/audit-log" element={<AdminLayout />}>
          <Route index element={<AdminAuditLog />} />
        </Route>

        <Route path="/analytics" element={<AdminLayout />}>
          <Route index element={<AdminAnalytics />} />
        </Route>

        {/* Lead routes — protected */}
        <Route path="/lead" element={<LeadLayout />}>
          <Route index element={<LeadDashboard />} />
          <Route path="tracking" element={<LeadEmployeeTracking />} />
          <Route path="tasks" element={<LeadTaskAssigning />} />
          <Route path="analytics" element={<LeadReports />} />
          <Route path="incentives" element={<LeadIncentive />} />
          <Route path="settings" element={<LeadSettings />} />
          {/* Lead employee & client views — reuse admin pages in lead layout */}
          <Route path="employees" element={<LeadEmployees />} />
          <Route path="employees/add" element={<AdminEmployeeOnboard />} />
          <Route path="employees/:id" element={<AdminEmployeeDetail />} />
          <Route path="employees/:id/edit" element={<Suspense fallback={<div />}><AdminEmployeeEdit /></Suspense>} />
          <Route path="clients" element={<LeadClients />} />
          <Route path="clients/:id" element={<AdminClientDetail />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
