Project Structure Explained
One Login, Two Portals
There is one single login page at /login. After logging in, the user lands on either the Admin portal or the Team Lead portal — currently it always goes to /dashboard (admin). In a real backend, the redirect would be based on the user's role returned from the API.

/login  ──── one page, one form, all users
   │
   ├── logged in as Admin   → /dashboard   (Admin portal)
   └── logged in as Lead    → /lead        (Team Lead portal)
The Two Portals
┌─────────────────────────────────────────────────────┐
│                   ADMIN PORTAL (/dashboard, /employees, etc.)
│                                                     │
│  Sidebar: Dashboard, Incentives, Employees,         │
│           Clients, Tasks, Analytics                 │
│                                                     │
│  Purpose: Super Admin — full system control         │
│  Has: Employee onboarding, client onboarding,       │
│       audit log, client allocation, task creation   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   TEAM LEAD PORTAL (/lead/*)        │
│                                                     │
│  Sidebar: Dashboard, Employees, Clients,            │
│           Task Assigning, Employee Tracking,        │
│           Analytics, Incentives, Settings           │
│                                                     │
│  Purpose: Team Lead — manage their own team daily   │
│  Has: Real-time tracking, task assigning,           │
│       incentive approvals, team analytics           │
└─────────────────────────────────────────────────────┘
Full Folder Structure
src/
│
├── main.tsx              ← Entry point, BrowserRouter wrapper
├── App.tsx               ← All routes + AuthProvider
├── index.css             ← All styles (Tailwind + lead portal CSS)
│
├── context/
│   └── AuthContext.tsx   ← login(), logout(), user state (sessionStorage)
│
├── routes/
│   └── ProtectedRoute.tsx ← Redirects to /login if not authenticated
│
├── config/
│   └── nav.ts            ← adminNav and leadNav sidebar item definitions
│
├── lib/
│   └── utils.ts          ← cn(), initials(), downloadCsv() helpers
│
├── data/                 ← Mock data (replace with API calls later)
│   ├── employees.ts
│   ├── clients.ts
│   ├── tasks.ts
│   ├── tracking.ts
│   ├── analytics.ts
│   └── users.ts
│
├── types/
│   └── shims.d.ts        ← TypeScript type declarations
│
├── components/
│   ├── layout/           ← Shell components
│   │   ├── AppLayout.tsx ← Sidebar + Topbar + <Outlet /> wrapper
│   │   ├── Sidebar.tsx   ← Navigation sidebar (dark theme)
│   │   └── Topbar.tsx    ← Top bar with search, notifications, user menu
│   │
│   ├── ui/               ← Reusable UI primitives
│   │   ├── Button, Avatar, Card, KpiCard, StatusBadge
│   │   ├── Toast, ConfirmModal, TaskModal, EditEmployeeModal
│   │   ├── DonutChart, ProgressBar, Spinner, UploadCard ...
│   │
│   └── features/         ← Larger feature-specific components
│       ├── ClientsView, ClientDetailView
│       ├── OnboardClientView, OnboardEmployeeView
│
├── pages/
│   ├── Login.tsx         ← Single login page (both portals)
│   ├── CreateAccount.tsx ← Registration page
│   ├── NotFound.tsx      ← 404 page
│   │
│   ├── admin/            ← Admin portal pages (18 pages)
│   │   ├── Dashboard, Employees, EmployeeDetail, EmployeeOnboarding
│   │   ├── EditEmployeePage, EmployeeAccess
│   │   ├── Clients, ClientDetail, OnboardClient, ClientAllocation
│   │   ├── ManageAllocation, Tasks, TaskDetail, CreateTask
│   │   ├── Incentives, Analytics, AuditLog, Documents
│   │
│   └── lead/             ← Team Lead portal pages (6 pages, ported from JS)
│       ├── Dashboard.tsx        ← Team overview, attention table, map
│       ├── EmployeeTracking.tsx ← Real-time field executive status
│       ├── TaskAssigning.tsx    ← Task queue, availability, live activity
│       ├── Reports.tsx          ← Team analytics, performance charts
│       ├── Incentive.tsx        ← Incentive pool, leaderboard, approvals
│       └── Settings.tsx         ← Profile + notification preferences




key note: 

Right now the AuthContext.login() is a mock — it accepts any email/password after 600ms. When you connect a real backend, only the login() function inside AuthContext.tsx needs to change. Everything else (routing, protection, session storage) stays the same.

Also, the userName and userRole shown in the two layouts ("Super Admin" and "Vikram Sharma") are currently hardcoded in App.tsx. Once real auth is wired, those should come from useAuth().user.