// src/layouts/AppShell.jsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { NotificationToast } from '@/shared/ui/NotificationToast'
import { useAuth } from '@/shared/hooks/useAuth'
import { lazy, Suspense } from 'react'

// Load DevTools only in dev mode and only for IT_ADMIN
// This ensures the panel NEVER shows on login page or for other roles
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    )
  : null

export const AppShell = () => {
  const { isITAdmin } = useAuth()

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#F5F6FA',
      }}
    >
      <Sidebar />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px', minHeight: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>

      <NotificationToast />

      {/* DevTools: only in development, only for IT_ADMIN, only after login */}
      {import.meta.env.DEV && isITAdmin && ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        </Suspense>
      )}
    </div>
  )
}

export default AppShell