// src/features/intelligence/LiveHeadcountPage.jsx
import { useQuery } from '@tanstack/react-query'
import { queryKeys, intelligenceApi } from '@/lib/api/queries'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageSpinner } from '@/shared/ui/Spinner'
import { ErrorState } from '@/shared/ui/ErrorState'
import { formatTime } from '@/shared/utils/formatters'
import { Users, UserCheck, UserX, Clock, RefreshCw } from 'lucide-react'

const SHIFT_COLORS = {
  A: { bg:'#EFF6FF', border:'#BFDBFE', text:'#1D4ED8', accent:'#3B82F6' },
  B: { bg:'#F0FDF4', border:'#BBF7D0', text:'#15803D', accent:'#22C55E' },
  C: { bg:'#FFFBEB', border:'#FDE68A', text:'#92400E', accent:'#F59E0B' },
  G: { bg:'#F5F3FF', border:'#DDD6FE', text:'#6D28D9', accent:'#8B5CF6' },
}

const EmployeeChip = ({ name, code, present }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border ${
    present
      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
      : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
  }`}>
    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: present ? '#22C55E' : '#EF4444' }} />
    <span className="font-medium">{name ?? code}</span>
    {code && name && <span className="opacity-60">{code}</span>}
  </div>
)

export default function LiveHeadcountPage() {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.intelligence.liveHeadcount(),
    queryFn:  intelligenceApi.liveHeadcount,
    refetchInterval: 30000,
  })

  if (isLoading) return <PageSpinner />
  if (error)     return <ErrorState message={error.message} onRetry={refetch} />

  const hc      = data ?? {}
  const overall = hc.overall  ?? {}
  const byShift = hc.byShift  ?? {}
  const shifts  = ['A', 'B', 'C', 'G']

  const pct = overall.scheduled > 0
    ? Math.round((overall.present / overall.scheduled) * 100)
    : 0

  const lastUpdated = hc.asOf
    ? formatTime(hc.asOf)
    : dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'

  return (
    <div>
      <PageHeader
        title="Live Headcount"
        subtitle="Real-time shift-wise attendance as of last 10 hours"
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#64748B]">
              <Clock size={12} />
              Updated {lastUpdated}
            </div>
            <button onClick={() => refetch()}
              className="btn-secondary text-[12px] h-8 px-3 flex items-center gap-1.5">
              <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Overall summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { label:'Scheduled',  value: overall.scheduled ?? 0,  icon: Users,     iconBg:'#F8FAFC',   iconColor:'#64748B' },
          { label:'Present',    value: overall.present   ?? 0,  icon: UserCheck, iconBg:'#F0FDF4',   iconColor:'#16A34A' },
          { label:'Absent',     value: overall.absent    ?? 0,  icon: UserX,     iconBg:'#FEF2F2',   iconColor:'#DC2626' },
          { label:'Attendance', value: `${pct}%`,               icon: Clock,     iconBg:'#EFF6FF',   iconColor:'#3B82F6' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[11px] font-medium text-[#64748B]">{s.label}</span>
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: s.iconBg }}>
                <s.icon size={15} style={{ color: s.iconColor }} />
              </div>
            </div>
            <div className="text-[24px] font-bold text-[#0F172A]">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Per-shift breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {shifts.map((shiftKey) => {
          const shift = byShift[shiftKey] ?? {}
          const presentList = shift.presentList ?? []
          const absentList  = shift.absentList  ?? []
          const scheduled   = shift.scheduled ?? (presentList.length + absentList.length)
          const shiftPct    = scheduled > 0 ? Math.round((presentList.length / scheduled) * 100) : 0
          const colors      = SHIFT_COLORS[shiftKey]

          return (
            <div key={shiftKey} className="card overflow-hidden">
              {/* Shift header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]"
                style={{ background: colors.bg }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[13px]"
                    style={{ background: 'white', color: colors.text, border: `1px solid ${colors.border}` }}>
                    {shiftKey}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: colors.text }}>
                      Shift {shiftKey}
                    </div>
                    <div className="text-[10.5px]" style={{ color: colors.text, opacity:0.7 }}>
                      {scheduled} scheduled
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[20px] font-bold" style={{ color: colors.text }}>{shiftPct}%</div>
                  <div className="text-[10.5px]" style={{ color: colors.text, opacity:0.7 }}>
                    {presentList.length} / {scheduled}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-4 py-2 bg-white border-b border-[#F8FAFC]">
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${shiftPct}%`, background: colors.accent }} />
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Present */}
                {presentList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <UserCheck size={12} className="text-[#16A34A]" />
                      <span className="text-[11px] font-semibold text-[#16A34A]">
                        Present ({presentList.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {presentList.map((emp, i) => (
                        <EmployeeChip key={i} name={emp.name ?? emp.employeeName} code={emp.employeeCode} present />
                      ))}
                    </div>
                  </div>
                )}

                {/* Absent */}
                {absentList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <UserX size={12} className="text-[#DC2626]" />
                      <span className="text-[11px] font-semibold text-[#DC2626]">
                        Absent ({absentList.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {absentList.map((emp, i) => (
                        <EmployeeChip key={i} name={emp.name ?? emp.employeeName} code={emp.employeeCode} present={false} />
                      ))}
                    </div>
                  </div>
                )}

                {presentList.length === 0 && absentList.length === 0 && (
                  <p className="text-[12px] text-[#94A3B8] text-center py-3">No employees scheduled for this shift</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}