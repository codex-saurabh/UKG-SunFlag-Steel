// src/features/employees/EmployeesPage.jsx
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { queryKeys, employeesApi } from '@/lib/api/queries'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { FiltersBar, SearchInput, FilterSelect } from '@/shared/ui/FiltersBar'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { SkeletonTable } from '@/shared/ui/SkeletonRow'
import { Pagination } from '@/shared/ui/Pagination'
import { ChevronRight } from 'lucide-react'

const AVATAR_COLORS = [
  ['#EFF6FF','#1D4ED8'],['#F0FDF4','#15803D'],['#FFFBEB','#D97706'],
  ['#F5F3FF','#7C3AED'],['#FFF1F2','#BE123C'],['#ECFDF5','#047857'],
]

export default function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [dept,   setDept]   = useState('')
  const [page,   setPage]   = useState(1)
  const navigate = useNavigate()

  const debouncedSearch = useDebounce(search, 300)

  const { data: deptList } = useQuery({
    queryKey: queryKeys.employees.departments(),
    queryFn:  employeesApi.departments,
  })

  const filters = {
    search:     debouncedSearch || undefined,
    department: dept || undefined,
    page, limit: 50,
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn:  () => employeesApi.list(filters),
    keepPreviousData: true,
  })

  const employees = data?.data ?? []
  const meta      = data?.meta

  return (
    <div>
      <PageHeader title="Employees" subtitle="All employees in the plant" />

      <FiltersBar
        onReset={() => { setSearch(''); setDept(''); setPage(1) }}
        hasActiveFilters={!!(debouncedSearch || dept)}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name…" className="w-52" />
        <FilterSelect
          value={dept} onChange={(v)=>{setDept(v);setPage(1)}}
          options={(deptList??[]).map(d=>({value:d,label:d}))}
          placeholder="All Departments" className="w-44"
        />
      </FiltersBar>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Code</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Shift</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonTable rows={10} cols={7} />}
            {!isLoading && error && (
              <tr><td colSpan={7}><ErrorState message={error.message} onRetry={refetch} /></td></tr>
            )}
            {!isLoading && !error && employees.length === 0 && (
              <tr><td colSpan={7}><EmptyState /></td></tr>
            )}
            {!isLoading && !error && employees.map((emp, i) => {
              const [bg, color] = AVATAR_COLORS[i % AVATAR_COLORS.length]
              const initials = (emp.name??'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
              return (
                <tr key={emp.employeeCode ?? i}
                  className="cursor-pointer"
                  onClick={() => navigate(`/employees/${emp.employeeCode}`)}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background:bg, color }}>
                        {initials}
                      </div>
                      <span className="text-[12px] font-medium text-[#0F172A]">{emp.name}</span>
                    </div>
                  </td>
                  <td className="font-mono text-[11px] text-[#64748B]">{emp.employeeCode}</td>
                  <td>{emp.department ?? '—'}</td>
                  <td className="text-[#64748B]">{emp.designation ?? '—'}</td>
                  <td>{emp.shift ?? '—'}</td>
                  <td>
                    <span className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                      emp.isActive!==false ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      {emp.isActive!==false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td><ChevronRight size={14} className="text-[#94A3B8]" /></td>
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
