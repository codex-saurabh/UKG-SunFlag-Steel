
// src/features/employees/EmployeeDetailPage.jsx
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { queryKeys, employeesApi } from '@/lib/api/queries'
import { PageSpinner } from '@/shared/ui/Spinner'
import { ErrorState } from '@/shared/ui/ErrorState'
import { ArrowLeft, User, Building2, Briefcase, Clock, Mail, Phone } from 'lucide-react'

export default function EmployeeDetailPage() {
  const { empCode } = useParams()
  const navigate = useNavigate()

  const { data: emp, isLoading, error } = useQuery({
    queryKey: queryKeys.employees.detail(empCode),
    queryFn:  () => employeesApi.detail(empCode),
    enabled:  !!empCode,
  })

  if (isLoading) return <PageSpinner />
  if (error) return <ErrorState message={error.response?.status === 404 ? 'Employee not found.' : error.message} />

  const initials = (emp?.name??'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

  const fields = [
    { icon: User,      label:'Employee Code', value: emp?.employeeCode },
    { icon: Building2, label:'Department',    value: emp?.department },
    { icon: Briefcase, label:'Designation',   value: emp?.designation },
    { icon: Clock,     label:'Shift',         value: emp?.shift ? `Shift ${emp.shift}` : '—' },
    { icon: Mail,      label:'Email',         value: emp?.email },
    { icon: Phone,     label:'Phone',         value: emp?.phone ?? emp?.mobile ?? '—' },
  ]

  return (
    <div>
      <button onClick={() => navigate('/employees')}
        className="flex items-center gap-1.5 text-[12px] text-[#64748B] hover:text-[#0F172A] mb-5 transition-colors">
        <ArrowLeft size={14} />
        Back to Employees
      </button>

      <div className="card p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-bold flex-shrink-0"
            style={{ background:'#EFF6FF', color:'#1D4ED8' }}>
            {initials}
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-[#0F172A]">{emp?.name}</h1>
            <p className="text-[13px] text-[#64748B]">{emp?.designation ?? 'Employee'} · {emp?.department}</p>
            <span className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full mt-1.5 ${
              emp?.isActive!==false ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'
            }`}>
              {emp?.isActive!==false ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.label} className="card p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
              <f.icon size={14} className="text-[#64748B]" />
            </div>
            <div>
              <div className="text-[10.5px] text-[#94A3B8]">{f.label}</div>
              <div className="text-[12.5px] font-medium text-[#0F172A]">{f.value ?? '—'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}