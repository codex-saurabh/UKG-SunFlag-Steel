// src/features/attendance/MissPunchPage.jsx
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
import { formatTime, formatDate } from '@/shared/utils/formatters'
import { AlertTriangle } from 'lucide-react'

export default function MissPunchPage() {
  const defaultTo   = format(new Date(), 'yyyy-MM-dd')
  const defaultFrom = format(subDays(new Date(), 7), 'yyyy-MM-dd')

  const [dateFrom, setFrom] = useState(defaultFrom)
  const [dateTo,   setTo]   = useState(defaultTo)
  const [page,     setPage] = useState(1)

  const filters = { dateFrom, dateTo, page, limit: 50 }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.attendance.missPunch(filters),
    queryFn:  () => attendanceApi.missPunch(filters),
    enabled:  !!dateFrom && !!dateTo,
  })

  const records = data?.data ?? []
  const meta    = data?.meta

  return (
    <div>
      <PageHeader
        title="Miss Punch"
        subtitle="Employees with missing punch-in or punch-out records"
      />

      <FiltersBar
        onReset={() => { setFrom(defaultFrom); setTo(defaultTo); setPage(1) }}
        hasActiveFilters={false}
      >
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-[#64748B]">From</label>
          <input type="date" value={dateFrom} onChange={(e)=>{setFrom(e.target.value);setPage(1)}}
            className="form-input h-8 text-[12px] w-36" />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-[#64748B]">To</label>
          <input type="date" value={dateTo} onChange={(e)=>{setTo(e.target.value);setPage(1)}}
            className="form-input h-8 text-[12px] w-36" min={dateFrom} />
        </div>
      </FiltersBar>

      {/* Summary banner */}
      {!isLoading && records.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4"
          style={{ background:'#FFFBEB', border:'1px solid #FDE68A' }}>
          <AlertTriangle size={14} className="text-[#D97706]" />
          <span className="text-[12px] text-[#92400E] font-medium">
            {meta?.total ?? records.length} miss punch records found between {formatDate(dateFrom)} and {formatDate(dateTo)}
          </span>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Date</th>
              <th>Shift</th>
              <th>Punch In</th>
              <th>Punch Out</th>
              <th>Missing</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonTable rows={8} cols={7} />}
            {!isLoading && error && (
              <tr><td colSpan={7}><ErrorState message={error.message} onRetry={refetch} /></td></tr>
            )}
            {!isLoading && !error && records.length === 0 && (
              <tr><td colSpan={7}><EmptyState title="No miss punch records" message="All employees have complete punch records for this period." /></td></tr>
            )}
            {!isLoading && !error && records.map((r, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background:'#FFFBEB', color:'#D97706' }}>
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
                <td>{r.punchIn  ? formatTime(r.punchIn)  : <span className="text-[#94A3B8]">—</span>}</td>
                <td>{r.punchOut ? formatTime(r.punchOut) : <span className="text-[#94A3B8]">—</span>}</td>
                <td>
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#92400E]">
                    {!r.punchIn && !r.punchOut ? 'Both' : !r.punchIn ? 'In' : 'Out'}
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