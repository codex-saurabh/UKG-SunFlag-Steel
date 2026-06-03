// src/features/analytics/AnalyticsPage.jsx
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { queryKeys, analyticsApi } from '@/lib/api/queries'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageSpinner } from '@/shared/ui/Spinner'
import { ErrorState } from '@/shared/ui/ErrorState'
import { currentMonth, currentYear, formatMonthYear } from '@/shared/utils/formatters'
import { CHART_COLORS } from '@/shared/utils/constants'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, Legend
} from 'recharts'

const MONTHS = [
  {value:'1',label:'Jan'},{value:'2',label:'Feb'},{value:'3',label:'Mar'},
  {value:'4',label:'Apr'},{value:'5',label:'May'},{value:'6',label:'Jun'},
  {value:'7',label:'Jul'},{value:'8',label:'Aug'},{value:'9',label:'Sep'},
  {value:'10',label:'Oct'},{value:'11',label:'Nov'},{value:'12',label:'Dec'},
]
const YEARS = ['2024','2025','2026']

export default function AnalyticsPage() {
  const [month, setMonth] = useState(String(currentMonth()))
  const [year,  setYear]  = useState(String(currentYear()))

  const { data: shiftData, isLoading: sl } = useQuery({
    queryKey: queryKeys.analytics.shiftBreakdown(month, year),
    queryFn:  () => analyticsApi.shiftBreakdown(month, year),
  })

  const { data: deptData, isLoading: dl } = useQuery({
    queryKey: queryKeys.analytics.deptRate(month, year),
    queryFn:  () => analyticsApi.deptRate(month, year),
  })

  const { data: trendData, isLoading: tl } = useQuery({
    queryKey: queryKeys.analytics.trend(30),
    queryFn:  () => analyticsApi.trend(30),
  })

  // Shift chart data
  const shiftChart = (shiftData ?? []).map((d) => ({
    shift:     `Shift ${d.shift}`,
    Present:   d.present  ?? 0,
    Absent:    d.absent   ?? 0,
    'Miss Punch': d.missPunch ?? 0,
    Leave:     d.leave    ?? 0,
  }))

  // Dept rate chart
  const deptChart = (deptData ?? []).map((d) => ({
    dept: d.department?.length > 12 ? d.department.slice(0,12)+'…' : d.department,
    rate: parseFloat(d.attendanceRate ?? d.rate ?? 0).toFixed(1),
    full: d.department,
  })).sort((a, b) => b.rate - a.rate)

  // Trend line chart
  const trendChart = (trendData ?? []).map((d) => ({
    date:    new Date(d.date).getDate(),
    present: d.present ?? 0,
    absent:  d.absent  ?? 0,
  }))

  const getBarColor = (rate) => {
    if (rate >= 90) return '#22C55E'
    if (rate >= 75) return '#3B82F6'
    if (rate >= 60) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle={`Attendance breakdown for ${formatMonthYear(Number(month), Number(year))}`}
        action={
          <div className="flex items-center gap-2">
            <select value={month} onChange={e=>setMonth(e.target.value)}
              className="form-select h-8 text-[12px] w-28">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={year} onChange={e=>setYear(e.target.value)}
              className="form-select h-8 text-[12px] w-24">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        }
      />

      {/* Department Attendance Rate */}
      <div className="card p-5 mb-4">
        <h2 className="text-[13px] font-semibold text-[#0F172A] mb-4">Department Attendance Rate</h2>
        {dl ? (
          <div className="h-48 skeleton rounded" />
        ) : deptChart.length === 0 ? (
          <p className="text-[12px] text-[#94A3B8] text-center py-10">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptChart} layout="vertical" margin={{ top:0, right:40, left:10, bottom:0 }}>
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize:11, fill:'#334155' }} tickLine={false} axisLine={false} width={90} />
              <Tooltip
                formatter={(v, _, p) => [`${v}%`, p.payload.full]}
                contentStyle={{ fontSize:11, border:'1px solid #E2E8F0', borderRadius:8 }}
              />
              <Bar dataKey="rate" radius={[0,4,4,0]} barSize={16}>
                {deptChart.map((d, i) => (
                  <Cell key={i} fill={getBarColor(d.rate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Shift breakdown */}
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold text-[#0F172A] mb-4">Shift Breakdown</h2>
          {sl ? (
            <div className="h-48 skeleton rounded" />
          ) : shiftChart.length === 0 ? (
            <p className="text-[12px] text-[#94A3B8] text-center py-10">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={shiftChart} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="shift" tick={{ fontSize:11, fill:'#64748B' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize:11, border:'1px solid #E2E8F0', borderRadius:8 }} />
                <Legend wrapperStyle={{ fontSize:10, paddingTop:8 }} />
                <Bar dataKey="Present"    fill={CHART_COLORS.present}   radius={[2,2,0,0]} stackId="s" />
                <Bar dataKey="Absent"     fill={CHART_COLORS.absent}    stackId="s" />
                <Bar dataKey="Miss Punch" fill={CHART_COLORS.missPunch} stackId="s" />
                <Bar dataKey="Leave"      fill={CHART_COLORS.leave}     radius={[2,2,0,0]} stackId="s" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 30-day trend */}
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold text-[#0F172A] mb-4">30-Day Trend</h2>
          {tl ? (
            <div className="h-48 skeleton rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendChart} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize:11, border:'1px solid #E2E8F0', borderRadius:8 }} />
                <Bar dataKey="present" fill={CHART_COLORS.present} radius={[2,2,0,0]} name="Present" />
                <Bar dataKey="absent"  fill={CHART_COLORS.absent}  radius={[2,2,0,0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}