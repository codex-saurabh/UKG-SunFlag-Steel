// src/layouts/AppShell.jsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { NotificationToast } from '@/shared/ui/NotificationToast'

export const AppShell = () => {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F6FA' }}>
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <NotificationToast />
    </div>
  )
}

export default AppShell