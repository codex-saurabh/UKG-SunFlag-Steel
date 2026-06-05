// src/layouts/Topbar.jsx
import { Menu, Bell, ChevronDown, LogOut } from 'lucide-react'
import { useUiStore } from '@/store/ui.store'
import { useAuth } from '@/shared/hooks/useAuth'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export const Topbar = () => {
  const toggleSidebar  = useUiStore((s) => s.toggleSidebar)
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef    = useRef(null)
  const navigate       = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const today = format(new Date(), "EEEE, d MMMM yyyy")

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      style={{
        height: '52px',
        background: '#fff',
        borderBottom: '1px solid #E8EAF0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        style={{
          width: '32px', height: '32px', borderRadius: '8px',
          border: '1px solid #E8EAF0', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748B', flexShrink: 0,
        }}
      >
        <Menu size={16} />
      </button>

      {/* Brand text only — no search box */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>UKG</span>
        <span style={{ fontSize: '11px', fontWeight: 400, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '1px' }}>Reports</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Date + greeting (right side, before bell) */}
      <div style={{ textAlign: 'right', marginRight: '4px' }}>
        {/* <div style={{ fontSize: '12px', fontWeight: 500, color: '#0F172A' }}>
          {user?.name?.split(' ')[0] ?? 'User'}
        </div> */}
        <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>{today}</div>
      </div>

      {/* Bell */}
      <button
        style={{
          width: '32px', height: '32px', borderRadius: '8px',
          border: '1px solid #E8EAF0', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748B', flexShrink: 0,
        }}
      >
        <Bell size={15} />
      </button>

      {/* User dropdown */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 10px', border: '1px solid #E8EAF0',
            borderRadius: '8px', background: '#fff', cursor: 'pointer',
          }}
        >
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: '#1D4ED8', color: '#BFDBFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
              {user?.name ?? 'User'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>
              {user?.role?.replace(/_/g, ' ') ?? ''}
            </div>
          </div>
          <ChevronDown size={12} style={{ color: '#94A3B8' }} />
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)',
            width: '200px', background: '#fff',
            border: '1px solid #E8EAF0', borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 50,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{user?.name}</div>
              <div style={{ fontSize: '10.5px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', background: 'none', border: 'none',
                fontSize: '12px', color: '#EF4444', cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Topbar


// // src/layouts/Topbar.jsx
// import { Menu, Bell, Search, ChevronDown, LogOut, User } from 'lucide-react'
// import { useUiStore } from '@/store/ui.store'
// import { useAuth } from '@/shared/hooks/useAuth'
// import { useState, useRef, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { format } from 'date-fns'

// export const Topbar = () => {
//   const toggleSidebar = useUiStore((s) => s.toggleSidebar)
//   const { user, logout } = useAuth()
//   const [dropdownOpen, setDropdownOpen] = useState(false)
//   const dropdownRef = useRef(null)
//   const navigate = useNavigate()

//   const initials = user?.name
//     ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
//     : '?'

//   const today = format(new Date(), "EEEE, d MMMM yyyy")
//   const greeting = () => {
//     const h = new Date().getHours()
//     if (h < 12) return 'Good morning'
//     if (h < 17) return 'Good afternoon'
//     return 'Good evening'
//   }

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handleClick = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setDropdownOpen(false)
//       }
//     }
//     document.addEventListener('mousedown', handleClick)
//     return () => document.removeEventListener('mousedown', handleClick)
//   }, [])

//   const handleLogout = () => {
//     logout()
//     navigate('/login')
//   }

//   return (
//     <header
//       className="flex items-center gap-3 px-5 flex-shrink-0 bg-white"
//       style={{
//         height: '52px',
//         borderBottom: '1px solid #E8EAF0',
//       }}
//     >
//       {/* Hamburger */}
//       <button
//         onClick={toggleSidebar}
//         className="w-8 h-8 rounded-lg border border-[#E8EAF0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors flex-shrink-0"
//       >
//         <Menu size={16} />
//       </button>

//       {/* Brand */}
//       <div className="flex items-center gap-1 flex-shrink-0">
//         <span className="text-[13.5px] font-bold text-[#0F172A] tracking-tight">UKG</span>
//         <span className="text-[11px] font-normal text-[#94A3B8] tracking-widest uppercase mt-px">Reports</span>
//       </div>

//       {/* Search */}
//       <div className="flex-1 max-w-xs ml-3">
//         <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5">
//           <Search size={13} className="text-[#94A3B8] flex-shrink-0" />
//           <span className="text-[12px] text-[#94A3B8]">Search reports, metrics…</span>
//         </div>
//       </div>

//       {/* Spacer */}
//       <div className="flex-1" />

//       {/* Greeting (hidden on small screens) */}
//       <div className="hidden xl:block text-right mr-2">
//         <div className="text-[11.5px] font-medium text-[#0F172A]">
//           {greeting()}, {user?.name?.split(' ')[0] ?? 'User'} 👋
//         </div>
//         <div className="text-[10px] text-[#94A3B8]">{today}</div>
//       </div>

//       {/* Bell */}
//       <button className="relative w-8 h-8 rounded-lg border border-[#E8EAF0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
//         <Bell size={15} />
//       </button>

//       {/* User dropdown */}
//       <div className="relative" ref={dropdownRef}>
//         <button
//           onClick={() => setDropdownOpen((o) => !o)}
//           className="flex items-center gap-2 px-2.5 py-1.5 border border-[#E8EAF0] rounded-lg hover:bg-[#F8FAFC] transition-colors"
//         >
//           <div
//             className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
//             style={{ background: '#1D4ED8', color: '#BFDBFE' }}
//           >
//             {initials}
//           </div>
//           <div className="hidden sm:block text-left">
//             <div className="text-[11.5px] font-semibold text-[#0F172A] leading-tight">{user?.name ?? 'User'}</div>
//             <div className="text-[10px] text-[#64748B]">
//               {user?.role?.replace(/_/g,' ') ?? ''}
//             </div>
//           </div>
//           <ChevronDown size={12} className="text-[#94A3B8]" />
//         </button>

//         {dropdownOpen && (
//           <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[#E8EAF0] rounded-xl shadow-lg z-50 py-1 overflow-hidden">
//             <div className="px-3 py-2 border-b border-[#F1F5F9]">
//               <div className="text-[12px] font-semibold text-[#0F172A]">{user?.name}</div>
//               <div className="text-[10.5px] text-[#64748B] truncate">{user?.email}</div>
//             </div>
//             <button
//               onClick={handleLogout}
//               className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
//             >
//               <LogOut size={13} />
//               Sign out
//             </button>
//           </div>
//         )}
//       </div>
//     </header>
//   )
// }

// export default Topbar