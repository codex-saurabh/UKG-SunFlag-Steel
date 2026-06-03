// src/layouts/Topbar.jsx
import { Menu, Bell, Search, ChevronDown, LogOut, User } from 'lucide-react'
import { useUiStore } from '@/store/ui.store'
import { useAuth } from '@/shared/hooks/useAuth'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export const Topbar = () => {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    : '?'

  const today = format(new Date(), "EEEE, d MMMM yyyy")
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className="flex items-center gap-3 px-5 flex-shrink-0 bg-white"
      style={{
        height: '52px',
        borderBottom: '1px solid #E8EAF0',
      }}
    >
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="w-8 h-8 rounded-lg border border-[#E8EAF0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors flex-shrink-0"
      >
        <Menu size={16} />
      </button>

      {/* Brand */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[13.5px] font-bold text-[#0F172A] tracking-tight">UKG</span>
        <span className="text-[11px] font-normal text-[#94A3B8] tracking-widest uppercase mt-px">Reports</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs ml-3">
        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5">
          <Search size={13} className="text-[#94A3B8] flex-shrink-0" />
          <span className="text-[12px] text-[#94A3B8]">Search reports, metrics…</span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Greeting (hidden on small screens) */}
      <div className="hidden xl:block text-right mr-2">
        <div className="text-[11.5px] font-medium text-[#0F172A]">
          {greeting()}, {user?.name?.split(' ')[0] ?? 'User'} 👋
        </div>
        <div className="text-[10px] text-[#94A3B8]">{today}</div>
      </div>

      {/* Bell */}
      <button className="relative w-8 h-8 rounded-lg border border-[#E8EAF0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
        <Bell size={15} />
      </button>

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 px-2.5 py-1.5 border border-[#E8EAF0] rounded-lg hover:bg-[#F8FAFC] transition-colors"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
            style={{ background: '#1D4ED8', color: '#BFDBFE' }}
          >
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-[11.5px] font-semibold text-[#0F172A] leading-tight">{user?.name ?? 'User'}</div>
            <div className="text-[10px] text-[#64748B]">
              {user?.role?.replace(/_/g,' ') ?? ''}
            </div>
          </div>
          <ChevronDown size={12} className="text-[#94A3B8]" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[#E8EAF0] rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            <div className="px-3 py-2 border-b border-[#F1F5F9]">
              <div className="text-[12px] font-semibold text-[#0F172A]">{user?.name}</div>
              <div className="text-[10.5px] text-[#64748B] truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
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