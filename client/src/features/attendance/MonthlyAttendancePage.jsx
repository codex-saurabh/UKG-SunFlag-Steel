// src/features/attendance/MonthlyAttendancePage.jsx
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { queryKeys, attendanceApi, employeesApi } from '@/lib/api/queries'
import { FiltersBar, FilterSelect } from '@/shared/ui/FiltersBar'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { SkeletonTable } from '@/shared/ui/SkeletonRow'
import { Pagination } from '@/shared/ui/Pagination'
import { currentMonth, currentYear, formatMonthYear } from '@/shared/utils/formatters'

const MONTHS = [
  {value:'1',label:'January'},{value:'2',label:'February'},{value:'3',label:'March'},
  {value:'4',label:'April'},{value:'5',label:'May'},{value:'6',label:'June'},
  {value:'7',label:'July'},{value:'8',label:'August'},{value:'9',label:'September'},
  {value:'10',label:'October'},{value:'11',label:'November'},{value:'12',label:'December'},
]
const YEARS = ['2024','2025','2026']

export default function MonthlyAttendancePage() {
  const [month, setMonth]   = useState(String(currentMonth()))
  const [year,  setYear]    = useState(String(currentYear()))
  const [dept,  setDept]    = useState('')
  const [page,  setPage]    = useState(1)

  const { data: deptList } = useQuery({
    queryKey: queryKeys.employees.departments(),
    queryFn:  employeesApi.departments,
  })

  const filters = { month, year, department: dept || undefined, page, limit: 50 }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.attendance.monthly(filters),
    queryFn:  () => attendanceApi.monthly(filters),
    keepPreviousData: true,
  })

  const records = data?.data ?? []
  const meta    = data?.meta

  return (
    <div>
      <PageHeader
        title="Monthly Attendance"
        subtitle={`Summary for ${formatMonthYear(Number(month), Number(year))}`}
      />

      <FiltersBar
        onReset={() => { setMonth(String(currentMonth())); setYear(String(currentYear())); setDept(''); setPage(1) }}
        hasActiveFilters={!!(dept)}
      >
        <FilterSelect value={month} onChange={(v)=>{setMonth(v);setPage(1)}}
          options={MONTHS} className="w-32" />
        <FilterSelect value={year} onChange={(v)=>{setYear(v);setPage(1)}}
          options={YEARS.map(y=>({value:y,label:y}))} className="w-24" />
        <FilterSelect value={dept} onChange={(v)=>{setDept(v);setPage(1)}}
          options={(deptList??[]).map(d=>({value:d,label:d}))}
          placeholder="All Departments" className="w-44" />
      </FiltersBar>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Miss Punch</th>
              <th>Leave</th>
              <th>OT Days</th>
              <th>Attendance %</th>
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
            {!isLoading && !error && records.map((r, i) => {
              const total = (r.presentDays||0) + (r.absentDays||0)
              const pct   = total > 0 ? Math.round(((r.presentDays||0)/total)*100) : 0
              return (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
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
                  <td className="text-[#15803D] font-medium">{r.presentDays ?? 0}</td>
                  <td className="text-[#B91C1C] font-medium">{r.absentDays  ?? 0}</td>
                  <td className="text-[#92400E] font-medium">{r.missPunchDays ?? 0}</td>
                  <td className="text-[#1D4ED8] font-medium">{r.leaveDays    ?? 0}</td>
                  <td className="text-[#7C3AED] font-medium">{r.overtimeDays ?? 0}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden" style={{width:60}}>
                        <div className="h-full rounded-full"
                          style={{ width:`${pct}%`, background: pct>=80?'#22C55E':pct>=60?'#F59E0B':'#EF4444' }} />
                      </div>
                      <span className="text-[11px] font-semibold text-[#0F172A]">{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {meta && <Pagination meta={meta} page={page} onPageChange={setPage} />}
      </div>
    </div>
  )
}