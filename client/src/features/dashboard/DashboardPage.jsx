// src/features/dashboard/DashboardPage.jsx
import { useQuery } from '@tanstack/react-query'
import { queryKeys, analyticsApi, attendanceApi, intelligenceApi } from '@/lib/api/queries'
import { useAuth } from '@/shared/hooks/useAuth'
import { PageSpinner } from '@/shared/ui/Spinner'
import { ErrorState } from '@/shared/ui/ErrorState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { formatTime, minutesToHHMM, formatDate } from '@/shared/utils/formatters'
import { CHART_COLORS } from '@/shared/utils/constants'
import {
  Users, UserCheck, AlertTriangle, CalendarOff,
  Clock, TrendingUp, TrendingDown, ArrowRight,
  Bell, ShieldAlert, RefreshCw, CheckCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { useState } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const DEPT_COLORS = ['#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#EC4899','#F97316']

export default function DashboardPage() {
  const { user, isITAdmin, isHRAdmin } = useAuth()
  const navigate = useNavigate()
  const [trendDays, setTrendDays] = useState(30)

  const { data: dashboard, isLoading: dashLoading, error: dashError } = useQuery({
    queryKey: queryKeys.analytics.dashboard(),
    queryFn:  analyticsApi.dashboard,
  })

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: queryKeys.attendance.today(),
    queryFn:  attendanceApi.today,
  })

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: queryKeys.analytics.trend(trendDays),
    queryFn:  () => analyticsApi.trend(trendDays),
  })

  const { data: deptData } = useQuery({
    queryKey: queryKeys.analytics.deptRate(new Date().getMonth()+1, new Date().getFullYear()),
    queryFn:  () => analyticsApi.deptRate(new Date().getMonth()+1, new Date().getFullYear()),
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (dashLoading || todayLoading) return <PageSpinner />
  if (dashError) return <ErrorState message={dashError.message} />

  const today   = todayData ?? {}
  // New fields from updated dashboard endpoint
  const alertSummary = dashboard?.alerts     ?? null
  const syncStatus   = dashboard?.syncStatus ?? []

  const kpis = [
    {
      label: 'Total Employees',
      value: dashboard?.totalEmployees ?? today?.totalEmployees ?? '—',
      icon: Users, iconBg: '#EFF6FF', iconColor: '#3B82F6',
      sub: 'Iron & Steel Plant',
    },
    {
      label: 'Present Today',
      value: today?.present ?? '—',
      icon: UserCheck, iconBg: '#F0FDF4', iconColor: '#16A34A',
      sub: today?.present && today?.total
        ? `${Math.round((today.present/today.total)*100)}% attendance` : '',
      deltaUp: true,
    },
    {
      label: 'Miss Punch',
      value: today?.missPunch ?? '—',
      icon: AlertTriangle, iconBg: '#FFFBEB', iconColor: '#D97706',
      sub: 'Needs review', deltaDown: true,
    },
    {
      label: 'On Leave',
      value: today?.onLeave ?? today?.leave ?? '—',
      icon: CalendarOff, iconBg: '#F5F3FF', iconColor: '#7C3AED',
      sub: 'Approved leaves',
    },
  ]

  // const chartData = (trendData ?? []).map((d) => ({
  //   date:        format(new Date(d.date), 'd MMM'),
  //   Present:     d.present   ?? 0,
  //   Absent:      d.absent    ?? 0,
  //   'Miss Punch': d.missPunch ?? 0,
  //   Leave:       d.leave     ?? 0,
  // }))
    const chartData = (trendData ?? []).map((d) => {
  const parsedDate = new Date(d.date);

  return {
    date: isNaN(parsedDate)
      ? "Invalid"
      : format(parsedDate, 'd MMM'),

    Present: d.present ?? 0,
    Absent: d.absent ?? 0,
    'Miss Punch': d.missPunch ?? 0,
    Leave: d.leave ?? 0,
  };
});

  const pieData = (deptData ?? []).map((d, i) => ({
    name:  d.department,
    value: d.employeeCount ?? d.count ?? 1,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }))

  const staleJobs = syncStatus.filter(j => j.isStale)

  return (
    <div>
      {/* Greeting */}
      <div className="mb-5">
        {/* <h1 className="text-[20px] font-semibold text-[#0F172A]">
          {greeting()}, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-[12.5px] text-[#64748B] mt-0.5">Here's what's happening today.</p> */}
      </div>

      {/* Alert banner — only if active alerts */}
      {(isITAdmin || isHRAdmin) && alertSummary?.total > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-4 border cursor-pointer"
          style={{
            background: alertSummary.critical > 0 ? '#FEF2F2' : '#FFFBEB',
            borderColor: alertSummary.critical > 0 ? '#FECACA' : '#FDE68A',
          }}
          onClick={() => navigate('/intelligence/alerts')}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert size={16} style={{ color: alertSummary.critical > 0 ? '#DC2626' : '#D97706' }} />
            <div>
              <span className="text-[12.5px] font-semibold" style={{ color: alertSummary.critical > 0 ? '#B91C1C' : '#92400E' }}>
                {alertSummary.total} active alert{alertSummary.total > 1 ? 's' : ''}
              </span>
              {alertSummary.critical > 0 && (
                <span className="text-[11.5px] ml-2" style={{ color: '#B91C1C' }}>
                  · {alertSummary.critical} critical
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: alertSummary.critical > 0 ? '#B91C1C' : '#92400E' }}>
            View alerts <ArrowRight size={13} />
          </div>
        </div>
      )}

      {/* Stale sync warning */}
      {(isITAdmin || isHRAdmin) && staleJobs.length > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-4 border cursor-pointer"
          style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
          onClick={() => navigate('/intelligence/sync-status')}
        >
          <div className="flex items-center gap-3">
            <RefreshCw size={15} className="text-[#D97706]" />
            <span className="text-[12.5px] font-semibold text-[#92400E]">
              {staleJobs.length} sync job{staleJobs.length > 1 ? 's' : ''} stale — data may be outdated
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#92400E]">
            View sync status <ArrowRight size={13} />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[11px] font-medium text-[#64748B]">{k.label}</span>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: k.iconBg }}>
                <k.icon size={17} style={{ color: k.iconColor }} />
              </div>
            </div>
            <div className="text-[26px] font-bold text-[#0F172A] leading-none">{k.value}</div>
            <div className="flex items-center gap-1 mt-1.5">
              {k.deltaUp   && <TrendingUp   size={11} className="text-[#16A34A]" />}
              {k.deltaDown && <TrendingDown size={11} className="text-[#DC2626]" />}
              <span className={`text-[11px] ${k.deltaUp?'text-[#16A34A]':k.deltaDown?'text-[#DC2626]':'text-[#64748B]'}`}>
                {k.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Intelligence strip — alert + sync summary */}
      {(isITAdmin || isHRAdmin) && alertSummary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
          {[
            { label:'Critical Alerts', value: alertSummary.critical ?? 0, color:'#B91C1C', bg:'#FEF2F2', to:'/intelligence/alerts' },
            { label:'Warning Alerts',  value: alertSummary.warning  ?? 0, color:'#92400E', bg:'#FFFBEB', to:'/intelligence/alerts' },
            { label:'Stale Syncs',     value: staleJobs.length,            color: staleJobs.length > 0 ? '#92400E' : '#15803D', bg: staleJobs.length > 0 ? '#FFFBEB' : '#F0FDF4', to:'/intelligence/sync-status' },
            { label:'Healthy Syncs',   value: syncStatus.filter(j=>!j.isStale).length, color:'#15803D', bg:'#F0FDF4', to:'/intelligence/sync-status' },
          ].map((s) => (
            <button key={s.label}
              onClick={() => navigate(s.to)}
              className="card p-3.5 text-left hover:border-[#BFDBFE] transition-colors"
            >
              <div className="text-[11px] text-[#64748B] mb-1">{s.label}</div>
              <div className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</div>
            </button>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-4">
        <div className="card p-4 xl:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-[#0F172A]">Attendance Overview</h2>
            <div className="flex gap-1">
              {[7, 30].map((d) => (
                <button key={d} onClick={() => setTrendDays(d)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                    trendDays===d
                      ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
                      : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {trendLoading ? (
            <div className="h-[120px] skeleton rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} barSize={6} margin={{ top:0, right:0, left:-30, bottom:0 }}>
                <XAxis dataKey="date" tick={{ fontSize:9, fill:'#94A3B8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize:9, fill:'#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize:11, border:'1px solid #E2E8F0', borderRadius:8, padding:'6px 10px' }}
                  labelStyle={{ fontWeight:600, color:'#0F172A', marginBottom:2 }} />
                <Bar dataKey="Present"    fill={CHART_COLORS.present}   radius={[2,2,0,0]} stackId="a" />
                <Bar dataKey="Absent"     fill={CHART_COLORS.absent}    stackId="a" />
                <Bar dataKey="Miss Punch" fill={CHART_COLORS.missPunch} stackId="a" />
                <Bar dataKey="Leave"      fill={CHART_COLORS.leave}     radius={[2,2,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F1F5F9]">
            {[
              { label:'Present', color:CHART_COLORS.present },
              { label:'Absent',  color:CHART_COLORS.absent },
              { label:'Miss Punch', color:CHART_COLORS.missPunch },
              { label:'Leave',   color:CHART_COLORS.leave },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background:l.color }} />
                <span className="text-[10.5px] text-[#64748B]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-[#0F172A]">Workforce Overview</h2>
            <span className="text-[10.5px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-md">By Dept</span>
          </div>
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={90} height={90}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={26} outerRadius={40} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {pieData.slice(0, 5).map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background:d.color }} />
                  <span className="text-[10.5px] text-[#334155] flex-1 truncate">{d.name}</span>
                  <span className="text-[10.5px] font-semibold text-[#0F172A]">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sync status strip */}
      {(isITAdmin || isHRAdmin) && syncStatus.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-[#0F172A]">Data Sync Health</h2>
            <button onClick={() => navigate('/intelligence/sync-status')}
              className="text-[11px] text-brand-500 hover:underline">View all →</button>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
            {syncStatus.map((job) => {
              const labels = {
                attendance_live_sync: 'Attendance', employees: 'Employees',
                leaves: 'Leaves', shifts: 'Shifts',
              }
              const isStale = job.isStale
              return (
                <div key={job.jobName} className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                  style={{ background: isStale ? '#FFFBEB' : '#F8FAFC', borderColor: isStale ? '#FDE68A' : '#E2E8F0' }}>
                  {isStale
                    ? <AlertTriangle size={12} className="text-[#D97706] flex-shrink-0" />
                    : <CheckCircle   size={12} className="text-[#16A34A] flex-shrink-0" />
                  }
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium truncate" style={{ color: isStale ? '#92400E' : '#0F172A' }}>
                      {labels[job.jobName] ?? job.jobName}
                    </div>
                    <div className="text-[9.5px]" style={{ color: isStale ? '#B45309' : '#94A3B8' }}>
                      {isStale ? `${job.staleMinutes}m stale` : 'Fresh'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick access */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {[
          { label:'Daily Attendance',  to:'/attendance/daily',          bg:'#F0FDF4', color:'#16A34A', icon:UserCheck },
          { label:'Live Headcount',    to:'/intelligence/live-headcount', bg:'#EFF6FF', color:'#3B82F6', icon:Users },
          { label:'Overtime Summary',  to:'/attendance/overtime',       bg:'#FFFBEB', color:'#D97706', icon:Clock },
          { label:'Export Reports',    to:'/exports',                   bg:'#F5F3FF', color:'#7C3AED', icon:TrendingUp },
        ].map((q) => (
          <button key={q.label} onClick={() => navigate(q.to)}
            className="card p-3 flex items-center gap-2.5 hover:border-[#BFDBFE] hover:bg-[#F8FBFF] text-left transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: q.bg }}>
              <q.icon size={15} style={{ color: q.color }} />
            </div>
            <span className="text-[11.5px] font-medium text-[#334155] flex-1">{q.label}</span>
            <ArrowRight size={13} className="text-[#94A3B8]" />
          </button>
        ))}
      </div>

      {/* Recent jobs */}
      {dashboard?.recentJobs?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
            <h2 className="text-[13px] font-semibold text-[#0F172A]">Recent Sync Jobs</h2>
            <button onClick={() => navigate('/monitoring/jobs')}
              className="text-[11px] text-brand-500 hover:underline">View all →</button>
          </div>
          <table className="data-table">
            <thead><tr><th>Job</th><th>Status</th><th>Last Run</th><th>Records</th></tr></thead>
            <tbody>
              {dashboard.recentJobs.slice(0,4).map((j, i) => (
                <tr key={i}>
                  <td className="font-medium">{j.jobName ?? j.name}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                      j.status==='success'?'bg-[#DCFCE7] text-[#15803D]':
                      j.status==='failed' ?'bg-[#FEE2E2] text-[#B91C1C]':
                      'bg-[#FEF9C3] text-[#92400E]'
                    }`}>{j.status}</span>
                  </td>
                  <td className="text-[#64748B]">{formatDate(j.endTime ?? j.createdAt)}</td>
                  <td className="text-[#64748B]">{j.recordsProcessed ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}



// // src/features/dashboard/DashboardPage.jsx
// import { useQuery } from '@tanstack/react-query'
// import { queryKeys, analyticsApi, attendanceApi } from '@/lib/api/queries'
// import { useAuth } from '@/shared/hooks/useAuth'
// import { PageSpinner } from '@/shared/ui/Spinner'
// import { ErrorState } from '@/shared/ui/ErrorState'
// import { StatusBadge } from '@/shared/ui/StatusBadge'
// import { formatTime, minutesToHHMM, formatDate } from '@/shared/utils/formatters'
// import { CHART_COLORS } from '@/shared/utils/constants'
// import {
//   Users, UserCheck, AlertTriangle, CalendarOff,
//   Clock, TrendingUp, TrendingDown, ArrowRight
// } from 'lucide-react'
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
//   PieChart, Pie, Cell, Legend
// } from 'recharts'
// import { useState } from 'react'
// import { format, subDays } from 'date-fns'
// import { useNavigate } from 'react-router-dom'

// const DEPT_COLORS = ['#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#EC4899','#F97316']

// export default function DashboardPage() {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [trendDays, setTrendDays] = useState(30)

//   const { data: dashboard, isLoading: dashLoading, error: dashError } = useQuery({
//     queryKey: queryKeys.analytics.dashboard(),
//     queryFn:  analyticsApi.dashboard,
//   })

//   const { data: todayData, isLoading: todayLoading } = useQuery({
//     queryKey: queryKeys.attendance.today(),
//     queryFn:  attendanceApi.today,
//   })

//   const { data: trendData, isLoading: trendLoading } = useQuery({
//     queryKey: queryKeys.analytics.trend(trendDays),
//     queryFn:  () => analyticsApi.trend(trendDays),
//   })

//   const { data: deptData } = useQuery({
//     queryKey: queryKeys.analytics.deptRate(new Date().getMonth()+1, new Date().getFullYear()),
//     queryFn:  () => analyticsApi.deptRate(new Date().getMonth()+1, new Date().getFullYear()),
//   })

//   const greeting = () => {
//     const h = new Date().getHours()
//     if (h < 12) return 'Good morning'
//     if (h < 17) return 'Good afternoon'
//     return 'Good evening'
//   }

//   if (dashLoading || todayLoading) return <PageSpinner />
//   if (dashError) return <ErrorState message={dashError.message} />

//   const today = todayData ?? {}
//   const kpis = [
//     {
//       label: 'Total Employees',
//       value: dashboard?.totalEmployees ?? today?.totalEmployees ?? '—',
//       icon: Users,
//       iconBg: '#EFF6FF', iconColor: '#3B82F6',
//       sub: 'Iron & Steel Plant',
//     },
//     {
//       label: 'Present Today',
//       value: today?.present ?? '—',
//       icon: UserCheck,
//       iconBg: '#F0FDF4', iconColor: '#16A34A',
//       sub: today?.present && today?.total
//         ? `${Math.round((today.present/today.total)*100)}% attendance`
//         : '',
//       deltaUp: true,
//     },
//     {
//       label: 'Miss Punch',
//       value: today?.missPunch ?? '—',
//       icon: AlertTriangle,
//       iconBg: '#FFFBEB', iconColor: '#D97706',
//       sub: 'Needs review',
//       deltaDown: true,
//     },
//     {
//       label: 'On Leave',
//       value: today?.onLeave ?? today?.leave ?? '—',
//       icon: CalendarOff,
//       iconBg: '#F5F3FF', iconColor: '#7C3AED',
//       sub: 'Approved leaves',
//     },
//   ]

//   // // Build chart data from trend
//   // const chartData = (trendData ?? []).map((d) => ({
//   //   date:      format(new Date(d.date), 'd MMM'),
//   //   Present:   d.present ?? 0,
//   //   Absent:    d.absent  ?? 0,
//   //   'Miss Punch': d.missPunch ?? 0,
//   //   Leave:     d.leave   ?? 0,
//   // }))

//   const chartData = (trendData ?? []).map((d) => {
//   const parsedDate = new Date(d.date);

//   return {
//     date: isNaN(parsedDate)
//       ? "Invalid"
//       : format(parsedDate, 'd MMM'),

//     Present: d.present ?? 0,
//     Absent: d.absent ?? 0,
//     'Miss Punch': d.missPunch ?? 0,
//     Leave: d.leave ?? 0,
//   };
// });

//   // Pie data from dept
//   const pieData = (deptData ?? []).map((d, i) => ({
//     name:  d.department,
//     value: d.employeeCount ?? d.count ?? 1,
//     color: DEPT_COLORS[i % DEPT_COLORS.length],
//   }))

//   return (
//     <div>
//       {/* Greeting */}
//       <div className="mb-5">
//         <h1 className="text-[20px] font-semibold text-[#0F172A]">
//           {greeting()}, {user?.name?.split(' ')[0] ?? 'there'} 👋
//         </h1>
//         <p className="text-[12.5px] text-[#64748B] mt-0.5">Here's what's happening today.</p>
//       </div>

//       {/* KPI Cards */}
//       <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
//         {kpis.map((k) => (
//           <div key={k.label} className="card p-4">
//             <div className="flex items-start justify-between mb-3">
//               <span className="text-[11px] font-medium text-[#64748B]">{k.label}</span>
//               <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
//                 style={{ backgroundColor: k.iconBg }}>
//                 <k.icon size={17} style={{ color: k.iconColor }} />
//               </div>
//             </div>
//             <div className="text-[26px] font-bold text-[#0F172A] leading-none">{k.value}</div>
//             <div className="flex items-center gap-1 mt-1.5">
//               {k.deltaUp   && <TrendingUp  size={11} className="text-[#16A34A]" />}
//               {k.deltaDown && <TrendingDown size={11} className="text-[#DC2626]" />}
//               <span className={`text-[11px] ${k.deltaUp?'text-[#16A34A]':k.deltaDown?'text-[#DC2626]':'text-[#64748B]'}`}>
//                 {k.sub}
//               </span>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Charts row */}
//       <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-4">
//         {/* Trend chart — 3 cols */}
//         <div className="card p-4 xl:col-span-3">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-[13px] font-semibold text-[#0F172A]">Attendance Overview</h2>
//             <div className="flex gap-1">
//               {[7, 30].map((d) => (
//                 <button key={d}
//                   onClick={() => setTrendDays(d)}
//                   className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
//                     trendDays===d
//                       ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
//                       : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
//                   }`}
//                 >
//                   {d}d
//                 </button>
//               ))}
//             </div>
//           </div>
//           {trendLoading ? (
//             <div className="h-[120px] skeleton rounded" />
//           ) : (
//             <ResponsiveContainer width="100%" height={120}>
//               <BarChart data={chartData} barSize={6} margin={{ top:0, right:0, left:-30, bottom:0 }}>
//                 <XAxis dataKey="date" tick={{ fontSize:9, fill:'#94A3B8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
//                 <YAxis tick={{ fontSize:9, fill:'#94A3B8' }} tickLine={false} axisLine={false} />
//                 <Tooltip
//                   contentStyle={{ fontSize:11, border:'1px solid #E2E8F0', borderRadius:8, padding:'6px 10px' }}
//                   labelStyle={{ fontWeight:600, color:'#0F172A', marginBottom:2 }}
//                 />
//                 <Bar dataKey="Present"    fill={CHART_COLORS.present}   radius={[2,2,0,0]} stackId="a" />
//                 <Bar dataKey="Absent"     fill={CHART_COLORS.absent}    radius={[0,0,0,0]} stackId="a" />
//                 <Bar dataKey="Miss Punch" fill={CHART_COLORS.missPunch} radius={[0,0,0,0]} stackId="a" />
//                 <Bar dataKey="Leave"      fill={CHART_COLORS.leave}     radius={[2,2,0,0]} stackId="a" />
//               </BarChart>
//             </ResponsiveContainer>
//           )}
//           <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F1F5F9]">
//             {[
//               { label:'Present',    color:CHART_COLORS.present },
//               { label:'Absent',     color:CHART_COLORS.absent },
//               { label:'Miss Punch', color:CHART_COLORS.missPunch },
//               { label:'Leave',      color:CHART_COLORS.leave },
//             ].map((l) => (
//               <div key={l.label} className="flex items-center gap-1.5">
//                 <span className="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background:l.color }} />
//                 <span className="text-[10.5px] text-[#64748B]">{l.label}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Workforce donut — 2 cols */}
//         <div className="card p-4 xl:col-span-2">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-[13px] font-semibold text-[#0F172A]">Workforce Overview</h2>
//             <span className="text-[10.5px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-md">
//               By Dept
//             </span>
//           </div>
//           <div className="flex items-center gap-3">
//             <ResponsiveContainer width={90} height={90}>
//               <PieChart>
//                 <Pie data={pieData} cx="50%" cy="50%" innerRadius={26} outerRadius={40} dataKey="value" paddingAngle={2}>
//                   {pieData.map((entry, i) => (
//                     <Cell key={i} fill={entry.color} />
//                   ))}
//                 </Pie>
//               </PieChart>
//             </ResponsiveContainer>
//             <div className="flex-1 space-y-1.5">
//               {pieData.slice(0, 5).map((d) => (
//                 <div key={d.name} className="flex items-center gap-2">
//                   <span className="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background:d.color }} />
//                   <span className="text-[10.5px] text-[#334155] flex-1 truncate">{d.name}</span>
//                   <span className="text-[10.5px] font-semibold text-[#0F172A]">{d.value}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Quick access */}
//       <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
//         {[
//           { label:'Workforce Overview',  to:'/employees',           bg:'#EFF6FF', color:'#3B82F6', icon:Users },
//           { label:'Daily Attendance',    to:'/attendance/daily',    bg:'#F0FDF4', color:'#16A34A', icon:UserCheck },
//           { label:'Overtime Summary',    to:'/attendance/overtime', bg:'#FFFBEB', color:'#D97706', icon:Clock },
//           { label:'Export Reports',      to:'/exports',             bg:'#F5F3FF', color:'#7C3AED', icon:TrendingUp },
//         ].map((q) => (
//           <button key={q.label}
//             onClick={() => navigate(q.to)}
//             className="card p-3 flex items-center gap-2.5 hover:border-[#BFDBFE] hover:bg-[#F8FBFF] text-left transition-colors"
//           >
//             <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
//               style={{ background: q.bg }}>
//               <q.icon size={15} style={{ color: q.color }} />
//             </div>
//             <span className="text-[11.5px] font-medium text-[#334155] flex-1">{q.label}</span>
//             <ArrowRight size={13} className="text-[#94A3B8]" />
//           </button>
//         ))}
//       </div>

//       {/* Recent jobs from dashboard */}
//       {dashboard?.recentJobs?.length > 0 && (
//         <div className="card overflow-hidden">
//           <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
//             <h2 className="text-[13px] font-semibold text-[#0F172A]">Recent Sync Jobs</h2>
//             <button onClick={() => navigate('/monitoring/jobs')}
//               className="text-[11px] text-brand-500 hover:underline">View all →</button>
//           </div>
//           <table className="data-table">
//             <thead>
//               <tr>
//                 <th>Job</th><th>Status</th><th>Last Run</th><th>Records</th>
//               </tr>
//             </thead>
//             <tbody>
//               {dashboard.recentJobs.slice(0,4).map((j, i) => (
//                 <tr key={i}>
//                   <td className="font-medium">{j.jobName ?? j.name}</td>
//                   <td>
//                     <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
//                       j.status==='success' ? 'bg-[#DCFCE7] text-[#15803D]' :
//                       j.status==='failed'  ? 'bg-[#FEE2E2] text-[#B91C1C]' :
//                       'bg-[#FEF9C3] text-[#92400E]'
//                     }`}>
//                       {j.status}
//                     </span>
//                   </td>
//                   <td className="text-[#64748B]">{formatDate(j.endTime ?? j.createdAt)}</td>
//                   <td className="text-[#64748B]">{j.recordsProcessed ?? '—'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   )
// }