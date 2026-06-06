// src/router/index.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import AppShell from '@/layouts/AppShell'
import { PageSpinner } from '@/shared/ui/Spinner'

// ── Lazy imports ──────────────────────────────────────────────────────────
const LoginPage           = lazy(() => import('@/features/auth/LoginPage'))
const DashboardPage       = lazy(() => import('@/features/dashboard/DashboardPage'))
const DailyAttendance     = lazy(() => import('@/features/attendance/DailyAttendancePage'))
const MonthlyAttendance   = lazy(() => import('@/features/attendance/MonthlyAttendancePage'))
const MissPunchPage       = lazy(() => import('@/features/attendance/MissPunchPage'))
const OvertimePage        = lazy(() => import('@/features/attendance/OvertimePage'))
const AnalyticsPage       = lazy(() => import('@/features/analytics/AnalyticsPage'))
const AlertsPage          = lazy(() => import('@/features/intelligence/AlertsPage'))
const LiveHeadcountPage   = lazy(() => import('@/features/intelligence/LiveHeadcountPage'))
const SyncStatusPage      = lazy(() => import('@/features/intelligence/SyncStatusPage'))
const EmployeesPage       = lazy(() => import('@/features/employees/EmployeesPage'))
const EmployeeDetailPage  = lazy(() => import('@/features/employees/EmployeeDetailPage'))
const ExportsPage         = lazy(() => import('@/features/exports/ExportsPage'))
const SystemHealthPage    = lazy(() => import('@/features/monitoring/SystemHealthPage'))
const JobsPage            = lazy(() => import('@/features/monitoring/JobsPage'))
const AuditLogsPage       = lazy(() => import('@/features/monitoring/AuditLogsPage'))
const UsersAdminPage      = lazy(() => import('@/features/admin/UsersAdminPage'))

const Wrap = ({ children }) => <Suspense fallback={<PageSpinner />}>{children}</Suspense>

const Guard = ({ roles, children }) => {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(role)) return <Navigate to="/dashboard" replace />
  return children
}

const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthRoute><Wrap><LoginPage /></Wrap></AuthRoute>,
  },
  {
    path: '/',
    element: <Guard><AppShell /></Guard>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },

      { path: 'dashboard', element: <Wrap><DashboardPage /></Wrap> },

      // Attendance
      { path: 'attendance/daily',
        element: <Guard roles={['IT_ADMIN','HR_ADMIN','TIME_OFFICE']}><Wrap><DailyAttendance /></Wrap></Guard> },
      { path: 'attendance/monthly',
        element: <Guard roles={['IT_ADMIN','HR_ADMIN','TIME_OFFICE']}><Wrap><MonthlyAttendance /></Wrap></Guard> },
      { path: 'attendance/miss-punch',
        element: <Guard roles={['IT_ADMIN','HR_ADMIN','TIME_OFFICE']}><Wrap><MissPunchPage /></Wrap></Guard> },
      { path: 'attendance/overtime',
        element: <Guard roles={['IT_ADMIN','HR_ADMIN']}><Wrap><OvertimePage /></Wrap></Guard> },

      // Analytics
      { path: 'analytics',
        element: <Guard roles={['IT_ADMIN','HR_ADMIN']}><Wrap><AnalyticsPage /></Wrap></Guard> },

      // Intelligence (new)
      { path: 'intelligence/alerts',
        element: <Guard roles={['IT_ADMIN','HR_ADMIN']}><Wrap><AlertsPage /></Wrap></Guard> },
      { path: 'intelligence/live-headcount',
        element: <Guard roles={['IT_ADMIN','HR_ADMIN','TIME_OFFICE']}><Wrap><LiveHeadcountPage /></Wrap></Guard> },
      { path: 'intelligence/sync-status',
        element: <Guard roles={['IT_ADMIN','HR_ADMIN']}><Wrap><SyncStatusPage /></Wrap></Guard> },

      // Employees
      { path: 'employees',            element: <Wrap><EmployeesPage /></Wrap> },
      { path: 'employees/:empCode',   element: <Wrap><EmployeeDetailPage /></Wrap> },

      // Exports
      { path: 'exports',
        element: <Guard roles={['IT_ADMIN','HR_ADMIN']}><Wrap><ExportsPage /></Wrap></Guard> },

      // Monitoring
      { path: 'monitoring/health',
        element: <Guard roles={['IT_ADMIN']}><Wrap><SystemHealthPage /></Wrap></Guard> },
      { path: 'monitoring/jobs',
        element: <Guard roles={['IT_ADMIN']}><Wrap><JobsPage /></Wrap></Guard> },
      { path: 'monitoring/audit',
        element: <Guard roles={['IT_ADMIN','HR_ADMIN']}><Wrap><AuditLogsPage /></Wrap></Guard> },

      // Admin
      { path: 'admin',
        element: <Guard roles={['IT_ADMIN']}><Wrap><UsersAdminPage /></Wrap></Guard> },

      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
])

export default router
