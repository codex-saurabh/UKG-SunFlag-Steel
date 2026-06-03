// src/layouts/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import { useAuth } from '@/shared/hooks/useAuth'
import { useUiStore } from '@/store/ui.store'
import {
  LayoutDashboard, CalendarCheck, CalendarDays, AlertTriangle,
  Clock, BarChart3, Users, Download, HeartPulse,
  Settings2, ShieldCheck, UserCog, ChevronRight,
  Building2
} from 'lucide-react'

const NAV_GROUPS = [
  {
    items: [
      { to: '/dashboard', label: 'Home', icon: LayoutDashboard, roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
    ]
  },
  {
    label: 'Attendance',
    items: [
      { to: '/attendance/daily',    label: 'Daily',       icon: CalendarCheck,  roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
      { to: '/attendance/monthly',  label: 'Monthly',     icon: CalendarDays,   roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
      { to: '/attendance/miss-punch', label: 'Miss Punch', icon: AlertTriangle, roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
      { to: '/attendance/overtime', label: 'Overtime',    icon: Clock,          roles: ['IT_ADMIN','HR_ADMIN'] },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['IT_ADMIN','HR_ADMIN'] },
    ]
  },
  {
    label: 'People',
    items: [
      { to: '/employees', label: 'Employees', icon: Users,    roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
      { to: '/exports',   label: 'Exports',   icon: Download, roles: ['IT_ADMIN','HR_ADMIN'] },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/monitoring/health', label: 'Health',     icon: HeartPulse,  roles: ['IT_ADMIN'] },
      { to: '/monitoring/jobs',   label: 'Jobs',       icon: Settings2,   roles: ['IT_ADMIN'] },
      { to: '/monitoring/audit',  label: 'Audit Logs', icon: ShieldCheck, roles: ['IT_ADMIN','HR_ADMIN'] },
      { to: '/admin',             label: 'Admin',      icon: UserCog,     roles: ['IT_ADMIN'] },
    ]
  },
]

export const Sidebar = () => {
  const { role, user } = useAuth()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    : '?'

  const canSee = (item) => item.roles.includes(role)

  return (
    <aside
      className="flex flex-col h-full transition-all duration-200"
      style={{
        width: sidebarOpen ? '200px' : '60px',
        background: '#12183A',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-4 flex-shrink-0"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
          <Building2 size={14} color="#fff" />
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <div className="text-white text-[13px] font-semibold leading-tight truncate">UKG Reports</div>
            <div className="text-[9px] tracking-widest uppercase" style={{ color:'rgba(255,255,255,0.35)' }}>
              Steel Plant
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
        {NAV_GROUPS.map((group, gi) => {
          const visible = group.items.filter(canSee)
          if (!visible.length) return null

          return (
            <div key={gi} className="mb-1">
              {group.label && sidebarOpen && (
                <div
                  className="text-[9.5px] font-semibold uppercase tracking-widest px-3.5 pt-3 pb-1"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {group.label}
                </div>
              )}
              {!group.label && gi > 0 && (
                <div className="my-1 mx-3" style={{ borderTop:'0.5px solid rgba(255,255,255,0.07)' }} />
              )}
              {visible.map((item) => (
                <SidebarItem key={item.to} item={item} collapsed={!sidebarOpen} />
              ))}
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div
        className="p-2.5 flex-shrink-0"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2 p-1.5 rounded-lg"
          style={{ cursor:'default' }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background:'#1D4ED8', color:'#BFDBFE' }}
          >
            {initials}
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium truncate" style={{ color:'rgba(255,255,255,0.9)' }}>
                {user?.name ?? 'User'}
              </div>
              <div className="text-[10px] truncate" style={{ color:'rgba(255,255,255,0.35)' }}>
                {user?.role?.replace('_',' ') ?? ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

const SidebarItem = ({ item, collapsed }) => {
  const location = useLocation()
  const isActive = location.pathname.startsWith(item.to)
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-2.5 mx-1.5 my-0.5 rounded-lg transition-all duration-150',
        collapsed ? 'px-2 py-2 justify-center' : 'px-2.5 py-1.5',
        isActive
          ? 'text-white'
          : 'hover:text-white',
      )}
      style={{
        color:      isActive ? '#fff' : 'rgba(255,255,255,0.52)',
        background: isActive ? 'rgba(59,130,246,0.18)' : 'transparent',
        borderLeft: isActive && !collapsed ? '2px solid #3B82F6' : '2px solid transparent',
      }}
    >
      <Icon size={15} style={{ color: isActive ? '#60A5FA' : 'inherit', flexShrink:0 }} />
      {!collapsed && (
        <span className="text-[12px] font-medium truncate">{item.label}</span>
      )}
    </NavLink>
  )
}

export default Sidebar