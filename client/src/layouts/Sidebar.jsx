// src/layouts/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { useUiStore } from '@/store/ui.store'
import { useQuery } from '@tanstack/react-query'
import { queryKeys, intelligenceApi } from '@/lib/api/queries'
import logoImg from '@/assets/logo.png'
import {
  LayoutDashboard, CalendarCheck, CalendarDays, AlertTriangle,
  Clock, BarChart3, Users, Download, HeartPulse,
  Settings2, ShieldCheck, UserCog, Bell, Activity, RefreshCw
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
      { to: '/attendance/daily',       label: 'Daily',        icon: CalendarCheck, roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
      { to: '/attendance/monthly',     label: 'Monthly',      icon: CalendarDays,  roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
      { to: '/attendance/miss-punch',  label: 'Miss Punch',   icon: AlertTriangle, roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
      { to: '/attendance/overtime',    label: 'Overtime',     icon: Clock,         roles: ['IT_ADMIN','HR_ADMIN'] },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['IT_ADMIN','HR_ADMIN'] },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/intelligence/alerts',         label: 'Alerts',         icon: Bell,      roles: ['IT_ADMIN','HR_ADMIN'], badge: 'alerts' },
      { to: '/intelligence/live-headcount', label: 'Live Headcount', icon: Activity,  roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
      { to: '/intelligence/sync-status',    label: 'Sync Status',    icon: RefreshCw, roles: ['IT_ADMIN','HR_ADMIN'] },
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
  const { role, isAuthenticated } = useAuth()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  const { data: alertSummary } = useQuery({
    queryKey: queryKeys.intelligence.summary(),
    queryFn:  intelligenceApi.alertsSummary,
    enabled:  isAuthenticated,
    refetchInterval: 60000,
    staleTime: 30000,
  })

  const canSee = (item) => item.roles.includes(role)

  const getBadge = (badgeKey) => {
    if (badgeKey === 'alerts' && alertSummary?.total > 0) {
      return {
        count: alertSummary.total,
        color: alertSummary.critical > 0 ? '#EF4444' : alertSummary.warning > 0 ? '#F59E0B' : '#3B82F6',
      }
    }
    return null
  }

  return (
    <aside
      style={{
        width: sidebarOpen ? '200px' : '60px',
        flexShrink: 0,
        // background: '#12183A',
        background: '#10384b',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo: company logo.png + "Steel Plant" text ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: sidebarOpen ? '14px 14px' : '14px 0',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          borderBottom: '0.5px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}
      >
        <img
          src={logoImg}
          alt="Company logo"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            objectFit: 'contain',
            flexShrink: 0,
          }}
          onError={(e) => {
            // Fallback if logo.png not found — show a coloured square
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextSibling.style.display = 'flex'
          }}
        />
        {/* Fallback div (hidden by default) */}
        <div style={{
          display: 'none',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '14px',
          color: '#fff',
          fontWeight: 700,
        }}>S</div>

        {sidebarOpen && (
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              Steel Plant
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              HR Analytics
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation — NO scrollbar visible ── */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 0',
          /* Hide scrollbar across all browsers */
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
        /* Hide webkit scrollbar via inline won't work, handled in globals.css */
        className="sidebar-nav"
      >
        {NAV_GROUPS.map((group, gi) => {
          const visible = group.items.filter(canSee)
          if (!visible.length) return null
          return (
            <div key={gi} style={{ marginBottom: '4px' }}>
              {group.label && sidebarOpen && (
                <div style={{
                  color: 'rgba(255,255,255,0.25)',
                  fontSize: '9.5px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '10px 14px 4px',
                }}>
                  {group.label}
                </div>
              )}
              {group.label && !sidebarOpen && <div style={{ height: '8px' }} />}
              {visible.map((item) => {
                const badge = item.badge ? getBadge(item.badge) : null
                return <SidebarItem key={item.to} item={item} collapsed={!sidebarOpen} badge={badge} />
              })}
            </div>
          )
        })}
      </nav>
      {/* No user footer — removed as requested */}
    </aside>
  )
}

const SidebarItem = ({ item, collapsed, badge }) => {
  const location = useLocation()
  const isActive = location.pathname.startsWith(item.to)
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : '9px',
        margin: '1px 6px',
        padding: collapsed ? '8px 0' : '7px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: '8px',
        textDecoration: 'none',
        color: isActive ? '#fff' : 'rgba(255,255,255,0.52)',
        background: isActive ? 'rgba(59,130,246,0.18)' : 'transparent',
        borderLeft: isActive && !collapsed ? '2px solid #3B82F6' : '2px solid transparent',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.52)' }}
    >
      {/* Icon + badge dot when collapsed */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Icon size={15} style={{ color: isActive ? '#60A5FA' : 'inherit', display: 'block' }} />
        {badge && collapsed && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '14px', height: '14px', borderRadius: '50%',
            background: badge.color, color: '#fff',
            fontSize: '8px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {badge.count > 9 ? '9+' : badge.count}
          </span>
        )}
      </div>

      {/* Label + badge pill when expanded */}
      {!collapsed && (
        <>
          <span style={{ fontSize: '12px', fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </span>
          {badge && (
            <span style={{
              background: badge.color, color: '#fff',
              fontSize: '9.5px', fontWeight: 700,
              padding: '1px 5px', borderRadius: '10px',
              flexShrink: 0,
            }}>
              {badge.count > 99 ? '99+' : badge.count}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export default Sidebar



// // src/layouts/Sidebar.jsx
// import { NavLink, useLocation } from 'react-router-dom'
// import { cn } from '@/shared/utils/cn'
// import { useAuth } from '@/shared/hooks/useAuth'
// import { useUiStore } from '@/store/ui.store'
// import { useQuery } from '@tanstack/react-query'
// import { queryKeys, intelligenceApi } from '@/lib/api/queries'
// import {
//   LayoutDashboard, CalendarCheck, CalendarDays, AlertTriangle,
//   Clock, BarChart3, Users, Download, HeartPulse,
//   Settings2, ShieldCheck, UserCog, Building2,
//   Bell, Activity, RefreshCw
// } from 'lucide-react'

// const NAV_GROUPS = [
//   {
//     items: [
//       { to: '/dashboard', label: 'Home', icon: LayoutDashboard, roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//     ]
//   },
//   {
//     label: 'Attendance',
//     items: [
//       { to: '/attendance/daily',      label: 'Daily',       icon: CalendarCheck,  roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//       { to: '/attendance/monthly',    label: 'Monthly',     icon: CalendarDays,   roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//       { to: '/attendance/miss-punch', label: 'Miss Punch',  icon: AlertTriangle,  roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//       { to: '/attendance/overtime',   label: 'Overtime',    icon: Clock,          roles: ['IT_ADMIN','HR_ADMIN'] },
//     ]
//   },
//   {
//     label: 'Analytics',
//     items: [
//       { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['IT_ADMIN','HR_ADMIN'] },
//     ]
//   },
//   {
//     label: 'Intelligence',
//     items: [
//       { to: '/intelligence/alerts',        label: 'Alerts',         icon: Bell,       roles: ['IT_ADMIN','HR_ADMIN'], badge: 'alerts' },
//       { to: '/intelligence/live-headcount',label: 'Live Headcount', icon: Activity,   roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//       { to: '/intelligence/sync-status',   label: 'Sync Status',    icon: RefreshCw,  roles: ['IT_ADMIN','HR_ADMIN'] },
//     ]
//   },
//   {
//     label: 'People',
//     items: [
//       { to: '/employees', label: 'Employees', icon: Users,    roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//       { to: '/exports',   label: 'Exports',   icon: Download, roles: ['IT_ADMIN','HR_ADMIN'] },
//     ]
//   },
//   {
//     label: 'System',
//     items: [
//       { to: '/monitoring/health', label: 'Health',     icon: HeartPulse,  roles: ['IT_ADMIN'] },
//       { to: '/monitoring/jobs',   label: 'Jobs',       icon: Settings2,   roles: ['IT_ADMIN'] },
//       { to: '/monitoring/audit',  label: 'Audit Logs', icon: ShieldCheck, roles: ['IT_ADMIN','HR_ADMIN'] },
//       { to: '/admin',             label: 'Admin',      icon: UserCog,     roles: ['IT_ADMIN'] },
//     ]
//   },
// ]

// export const Sidebar = () => {
//   const { role, user, isAuthenticated } = useAuth()
//   const sidebarOpen = useUiStore((s) => s.sidebarOpen)

//   // Fetch alert summary for badge
//   const { data: alertSummary } = useQuery({
//     queryKey: queryKeys.intelligence.summary(),
//     queryFn:  intelligenceApi.alertsSummary,
//     enabled:  isAuthenticated,
//     refetchInterval: 60000,
//     staleTime: 30000,
//   })

//   const initials = user?.name
//     ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
//     : '?'

//   const canSee = (item) => item.roles.includes(role)

//   const getBadge = (badgeKey) => {
//     if (badgeKey === 'alerts' && alertSummary?.total > 0) {
//       return {
//         count: alertSummary.total,
//         color: alertSummary.critical > 0 ? '#EF4444' : alertSummary.warning > 0 ? '#F59E0B' : '#3B82F6',
//       }
//     }
//     return null
//   }

//   return (
//     <aside
//       className="flex flex-col h-full transition-all duration-200"
//       style={{
//         width: sidebarOpen ? '200px' : '60px',
//         background: '#12183A',
//         flexShrink: 0,
//       }}
//     >
//       {/* Logo */}
//       <div
//         className="flex items-center gap-2.5 px-3.5 py-4 flex-shrink-0"
//         style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
//       >
//         <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
//           style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
//           <Building2 size={14} color="#fff" />
//         </div>
//         {sidebarOpen && (
//           <div className="min-w-0">
//             <div className="text-white text-[13px] font-semibold leading-tight truncate">UKG Reports</div>
//             <div className="text-[9px] tracking-widest uppercase" style={{ color:'rgba(255,255,255,0.35)' }}>
//               Steel Plant
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Nav */}
//       <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth:'none' }}>
//         {NAV_GROUPS.map((group, gi) => {
//           const visible = group.items.filter(canSee)
//           if (!visible.length) return null
//           return (
//             <div key={gi} className="mb-1">
//               {group.label && sidebarOpen && (
//                 <div
//                   className="text-[9.5px] font-semibold uppercase tracking-widest px-3.5 pt-3 pb-1"
//                   style={{ color: 'rgba(255,255,255,0.25)' }}
//                 >
//                   {group.label}
//                 </div>
//               )}
//               {!group.label && gi > 0 && (
//                 <div className="my-1 mx-3" style={{ borderTop:'0.5px solid rgba(255,255,255,0.07)' }} />
//               )}
//               {visible.map((item) => {
//                 const badge = item.badge ? getBadge(item.badge) : null
//                 return <SidebarItem key={item.to} item={item} collapsed={!sidebarOpen} badge={badge} />
//               })}
//             </div>
//           )
//         })}
//       </nav>

//       {/* User footer */}
//       <div className="p-2.5 flex-shrink-0" style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)' }}>
//         <div className="flex items-center gap-2 p-1.5 rounded-lg">
//           <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
//             style={{ background:'#1D4ED8', color:'#BFDBFE' }}>
//             {initials}
//           </div>
//           {sidebarOpen && (
//             <div className="min-w-0">
//               <div className="text-[11.5px] font-medium truncate" style={{ color:'rgba(255,255,255,0.9)' }}>
//                 {user?.name ?? 'User'}
//               </div>
//               <div className="text-[10px] truncate" style={{ color:'rgba(255,255,255,0.35)' }}>
//                 {user?.role?.replace(/_/g,' ') ?? ''}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </aside>
//   )
// }

// const SidebarItem = ({ item, collapsed, badge }) => {
//   const location = useLocation()
//   const isActive = location.pathname.startsWith(item.to)
//   const Icon = item.icon

//   return (
//     <NavLink
//       to={item.to}
//       title={collapsed ? item.label : undefined}
//       className="flex items-center gap-2.5 mx-1.5 my-0.5 rounded-lg transition-all duration-150"
//       style={{
//         padding:    collapsed ? '8px' : '6px 10px',
//         justifyContent: collapsed ? 'center' : 'flex-start',
//         color:      isActive ? '#fff' : 'rgba(255,255,255,0.52)',
//         background: isActive ? 'rgba(59,130,246,0.18)' : 'transparent',
//         borderLeft: isActive && !collapsed ? '2px solid #3B82F6' : '2px solid transparent',
//       }}
//     >
//       <div className="relative flex-shrink-0">
//         <Icon size={15} style={{ color: isActive ? '#60A5FA' : 'inherit' }} />
//         {badge && collapsed && (
//           <span
//             className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white leading-none"
//             style={{ background: badge.color }}
//           >
//             {badge.count > 9 ? '9+' : badge.count}
//           </span>
//         )}
//       </div>
//       {!collapsed && (
//         <>
//           <span className="text-[12px] font-medium truncate flex-1">{item.label}</span>
//           {badge && (
//             <span
//               className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full text-white leading-none"
//               style={{ background: badge.color }}
//             >
//               {badge.count > 99 ? '99+' : badge.count}
//             </span>
//           )}
//         </>
//       )}
//     </NavLink>
//   )
// }

// export default Sidebar



// // src/layouts/Sidebar.jsx
// import { NavLink, useLocation } from 'react-router-dom'
// import { cn } from '@/shared/utils/cn'
// import { useAuth } from '@/shared/hooks/useAuth'
// import { useUiStore } from '@/store/ui.store'
// import {
//   LayoutDashboard, CalendarCheck, CalendarDays, AlertTriangle,
//   Clock, BarChart3, Users, Download, HeartPulse,
//   Settings2, ShieldCheck, UserCog, ChevronRight,
//   Building2
// } from 'lucide-react'

// const NAV_GROUPS = [
//   {
//     items: [
//       { to: '/dashboard', label: 'Home', icon: LayoutDashboard, roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//     ]
//   },
//   {
//     label: 'Attendance',
//     items: [
//       { to: '/attendance/daily',    label: 'Daily',       icon: CalendarCheck,  roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//       { to: '/attendance/monthly',  label: 'Monthly',     icon: CalendarDays,   roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//       { to: '/attendance/miss-punch', label: 'Miss Punch', icon: AlertTriangle, roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//       { to: '/attendance/overtime', label: 'Overtime',    icon: Clock,          roles: ['IT_ADMIN','HR_ADMIN'] },
//     ]
//   },
//   {
//     label: 'Analytics',
//     items: [
//       { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['IT_ADMIN','HR_ADMIN'] },
//     ]
//   },
//   {
//     label: 'People',
//     items: [
//       { to: '/employees', label: 'Employees', icon: Users,    roles: ['IT_ADMIN','HR_ADMIN','TIME_OFFICE'] },
//       { to: '/exports',   label: 'Exports',   icon: Download, roles: ['IT_ADMIN','HR_ADMIN'] },
//     ]
//   },
//   {
//     label: 'System',
//     items: [
//       { to: '/monitoring/health', label: 'Health',     icon: HeartPulse,  roles: ['IT_ADMIN'] },
//       { to: '/monitoring/jobs',   label: 'Jobs',       icon: Settings2,   roles: ['IT_ADMIN'] },
//       { to: '/monitoring/audit',  label: 'Audit Logs', icon: ShieldCheck, roles: ['IT_ADMIN','HR_ADMIN'] },
//       { to: '/admin',             label: 'Admin',      icon: UserCog,     roles: ['IT_ADMIN'] },
//     ]
//   },
// ]

// export const Sidebar = () => {
//   const { role, user } = useAuth()
//   const sidebarOpen = useUiStore((s) => s.sidebarOpen)

//   const initials = user?.name
//     ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
//     : '?'

//   const canSee = (item) => item.roles.includes(role)

//   return (
//     <aside
//       className="flex flex-col h-full transition-all duration-200"
//       style={{
//         width: sidebarOpen ? '200px' : '60px',
//         background: '#12183A',
//         flexShrink: 0,
//       }}
//     >
//       {/* Logo */}
//       <div
//         className="flex items-center gap-2.5 px-3.5 py-4 flex-shrink-0"
//         style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
//       >
//         <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
//           style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
//           <Building2 size={14} color="#fff" />
//         </div>
//         {sidebarOpen && (
//           <div className="min-w-0">
//             <div className="text-white text-[13px] font-semibold leading-tight truncate">UKG Reports</div>
//             <div className="text-[9px] tracking-widest uppercase" style={{ color:'rgba(255,255,255,0.35)' }}>
//               Steel Plant
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Nav */}
//       <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
//         {NAV_GROUPS.map((group, gi) => {
//           const visible = group.items.filter(canSee)
//           if (!visible.length) return null

//           return (
//             <div key={gi} className="mb-1">
//               {group.label && sidebarOpen && (
//                 <div
//                   className="text-[9.5px] font-semibold uppercase tracking-widest px-3.5 pt-3 pb-1"
//                   style={{ color: 'rgba(255,255,255,0.25)' }}
//                 >
//                   {group.label}
//                 </div>
//               )}
//               {!group.label && gi > 0 && (
//                 <div className="my-1 mx-3" style={{ borderTop:'0.5px solid rgba(255,255,255,0.07)' }} />
//               )}
//               {visible.map((item) => (
//                 <SidebarItem key={item.to} item={item} collapsed={!sidebarOpen} />
//               ))}
//             </div>
//           )
//         })}
//       </nav>

//       {/* User footer */}
//       <div
//         className="p-2.5 flex-shrink-0"
//         style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)' }}
//       >
//         <div className="flex items-center gap-2 p-1.5 rounded-lg"
//           style={{ cursor:'default' }}>
//           <div
//             className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
//             style={{ background:'#1D4ED8', color:'#BFDBFE' }}
//           >
//             {initials}
//           </div>
//           {sidebarOpen && (
//             <div className="min-w-0">
//               <div className="text-[11.5px] font-medium truncate" style={{ color:'rgba(255,255,255,0.9)' }}>
//                 {user?.name ?? 'User'}
//               </div>
//               <div className="text-[10px] truncate" style={{ color:'rgba(255,255,255,0.35)' }}>
//                 {user?.role?.replace('_',' ') ?? ''}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </aside>
//   )
// }

// const SidebarItem = ({ item, collapsed }) => {
//   const location = useLocation()
//   const isActive = location.pathname.startsWith(item.to)
//   const Icon = item.icon

//   return (
//     <NavLink
//       to={item.to}
//       title={collapsed ? item.label : undefined}
//       className={cn(
//         'flex items-center gap-2.5 mx-1.5 my-0.5 rounded-lg transition-all duration-150',
//         collapsed ? 'px-2 py-2 justify-center' : 'px-2.5 py-1.5',
//         isActive
//           ? 'text-white'
//           : 'hover:text-white',
//       )}
//       style={{
//         color:      isActive ? '#fff' : 'rgba(255,255,255,0.52)',
//         background: isActive ? 'rgba(59,130,246,0.18)' : 'transparent',
//         borderLeft: isActive && !collapsed ? '2px solid #3B82F6' : '2px solid transparent',
//       }}
//     >
//       <Icon size={15} style={{ color: isActive ? '#60A5FA' : 'inherit', flexShrink:0 }} />
//       {!collapsed && (
//         <span className="text-[12px] font-medium truncate">{item.label}</span>
//       )}
//     </NavLink>
//   )
// }

// export default Sidebar