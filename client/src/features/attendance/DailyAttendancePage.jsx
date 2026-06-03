// src/features/attendance/DailyAttendancePage.jsx
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { queryKeys, attendanceApi, employeesApi } from '@/lib/api/queries'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { FiltersBar, SearchInput, FilterSelect } from '@/shared/ui/FiltersBar'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Pagination } from '@/shared/ui/Pagination'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { SkeletonTable } from '@/shared/ui/SkeletonRow'
import { formatTime, minutesToHHMM, todayString } from '@/shared/utils/formatters'
import { SHIFTS } from '@/shared/utils/constants'

const STATUS_OPTIONS = ['Present','Absent','Miss Punch','Leave','Holiday','Week Off']

export default function DailyAttendancePage() {
  const [date,       setDate]       = useState(todayString())
  const [department, setDept]       = useState('')
  const [status,     setStatus]     = useState('')
  const [shift,      setShift]      = useState('')
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(1)

  const debouncedSearch = useDebounce(search, 300)

  const { data: deptList } = useQuery({
    queryKey: queryKeys.employees.departments(),
    queryFn:  employeesApi.departments,
  })

  const filters = {
    date,
    department: department || undefined,
    status:     status     || undefined,
    shift:      shift      || undefined,
    employeeCode: debouncedSearch || undefined,
    page,
    limit: 50,
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.attendance.daily(filters),
    queryFn:  () => attendanceApi.daily(filters),
    keepPreviousData: true,
  })

  const records = data?.data ?? []
  const meta    = data?.meta

  const hasFilters = !!(department || status || shift || debouncedSearch)

  const handleReset = () => {
    setDept(''); setStatus(''); setShift(''); setSearch(''); setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Daily Attendance"
        subtitle="View punch-in, punch-out and status for any date"
      />

      <FiltersBar onReset={handleReset} hasActiveFilters={hasFilters}>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-[#64748B] whitespace-nowrap">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1) }}
            className="form-input h-8 text-[12px] w-36"
          />
        </div>

        <FilterSelect
          value={department} onChange={(v) => { setDept(v); setPage(1) }}
          options={(deptList ?? []).map((d) => ({ value: d, label: d }))}
          placeholder="All Departments"
          className="w-44"
        />

        <FilterSelect
          value={status} onChange={(v) => { setStatus(v); setPage(1) }}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
          placeholder="All Statuses"
          className="w-36"
        />

        <FilterSelect
          value={shift} onChange={(v) => { setShift(v); setPage(1) }}
          options={SHIFTS.map((s) => ({ value: s, label: `Shift ${s}` }))}
          placeholder="All Shifts"
          className="w-28"
        />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Emp code…"
          className="w-36"
        />
      </FiltersBar>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Shift</th>
              <th>In Time</th>
              <th>Out Time</th>
              <th>Work Hrs</th>
              <th>OT</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonTable rows={10} cols={8} />}
            {!isLoading && error && (
              <tr><td colSpan={8}><ErrorState message={error.message} onRetry={refetch} /></td></tr>
            )}
            {!isLoading && !error && records.length === 0 && (
              <tr><td colSpan={8}><EmptyState /></td></tr>
            )}
            {!isLoading && !error && records.map((r, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      style={{ background:'#EFF6FF', color:'#1D4ED8' }}>
                      {(r.employeeName??'').split(' ').map(w=>w[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-[#0F172A]">{r.employeeName}</div>
                      <div className="text-[10px] text-[#94A3B8]">{r.employeeCode}</div>
                    </div>
                  </div>
                </td>
                <td>{r.department ?? '—'}</td>
                <td>{r.shift ?? '—'}</td>
                <td>{r.punchIn  ? formatTime(r.punchIn)  : <span className="text-[#94A3B8]">—</span>}</td>
                <td>{r.punchOut ? formatTime(r.punchOut) : <span className="text-[#94A3B8]">—</span>}</td>
                <td>{minutesToHHMM(r.workMinutes ?? r.totalWorkMinutes)}</td>
                <td>{minutesToHHMM(r.otMinutes   ?? r.overtimeMinutes)}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {meta && (
          <Pagination meta={meta} page={page} onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}