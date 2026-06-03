// src/features/attendance/OvertimePage.jsx
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { queryKeys, attendanceApi } from '@/lib/api/queries'
import { FiltersBar } from '@/shared/ui/FiltersBar'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { SkeletonTable } from '@/shared/ui/SkeletonRow'
import { Pagination } from '@/shared/ui/Pagination'
import { minutesToHHMM, formatDate, formatTime } from '@/shared/utils/formatters'

export default function OvertimePage() {
  const defaultTo   = format(new Date(), 'yyyy-MM-dd')
  const defaultFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const [dateFrom,      setFrom]    = useState(defaultFrom)
  const [dateTo,        setTo]      = useState(defaultTo)
  const [minOtMinutes,  setMinOt]   = useState('')
  const [page,          setPage]    = useState(1)

  const filters = {
    dateFrom, dateTo,
    minOtMinutes: minOtMinutes || undefined,
    page, limit: 50,
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.attendance.overtime(filters),
    queryFn:  () => attendanceApi.overtime(filters),
    enabled:  !!dateFrom && !!dateTo,
  })

  const records = data?.data ?? []
  const meta    = data?.meta

  return (
    <div>
      <PageHeader
        title="Overtime"
        subtitle="Employees who worked beyond their scheduled shift hours"
      />

      <FiltersBar
        onReset={() => { setFrom(defaultFrom); setTo(defaultTo); setMinOt(''); setPage(1) }}
        hasActiveFilters={!!minOtMinutes}
      >
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-[#64748B]">From</label>
          <input type="date" value={dateFrom} onChange={(e)=>{setFrom(e.target.value);setPage(1)}}
            className="form-input h-8 text-[12px] w-36" />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-[#64748B]">To</label>
          <input type="date" value={dateTo} min={dateFrom} onChange={(e)=>{setTo(e.target.value);setPage(1)}}
            className="form-input h-8 text-[12px] w-36" />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-[#64748B]">Min OT</label>
          <select value={minOtMinutes} onChange={(e)=>{setMinOt(e.target.value);setPage(1)}}
            className="form-select h-8 text-[12px] w-32">
            <option value="">Any duration</option>
            <option value="30">30+ min</option>
            <option value="60">1h+</option>
            <option value="120">2h+</option>
            <option value="180">3h+</option>
          </select>
        </div>
      </FiltersBar>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Date</th>
              <th>Shift</th>
              <th>In</th>
              <th>Out</th>
              <th>OT Duration</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonTable rows={8} cols={7} />}
            {!isLoading && error && (
              <tr><td colSpan={7}><ErrorState message={error.message} onRetry={refetch} /></td></tr>
            )}
            {!isLoading && !error && records.length === 0 && (
              <tr><td colSpan={7}><EmptyState title="No overtime records" message="No employees worked overtime in this period." /></td></tr>
            )}
            {!isLoading && !error && records.map((r, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background:'#F3E8FF', color:'#7C3AED' }}>
                      {(r.employeeName??'').split(' ').map(w=>w[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-[#0F172A]">{r.employeeName}</div>
                      <div className="text-[10px] text-[#94A3B8]">{r.employeeCode}</div>
                    </div>
                  </div>
                </td>
                <td>{r.department ?? '—'}</td>
                <td>{formatDate(r.date)}</td>
                <td>{r.shift ?? '—'}</td>
                <td>{r.punchIn  ? formatTime(r.punchIn)  : '—'}</td>
                <td>{r.punchOut ? formatTime(r.punchOut) : '—'}</td>
                <td>
                  <span className="text-[11.5px] font-semibold text-[#7C3AED]">
                    {minutesToHHMM(r.otMinutes ?? r.overtimeMinutes)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {meta && <Pagination meta={meta} page={page} onPageChange={setPage} />}
      </div>
    </div>
  )
}