// src/features/exports/ExportsPage.jsx
import { useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ExportButton } from '@/shared/ui/ExportButton'
import { useExport } from '@/shared/hooks/useExport'
import { currentMonth, currentYear, formatMonthYear } from '@/shared/utils/formatters'
import { FileSpreadsheet, Calendar, Clock } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { queryKeys, employeesApi } from '@/lib/api/queries'

const MONTHS = Array.from({length:12},(_,i)=>({ value:String(i+1), label:new Date(2024,i,1).toLocaleString('default',{month:'long'}) }))
const YEARS  = ['2024','2025','2026']

export default function ExportsPage() {
  const { download, loading } = useExport()

  // Monthly export state
  const [mMonth, setMMonth] = useState(String(currentMonth()))
  const [mYear,  setMYear]  = useState(String(currentYear()))
  const [mDept,  setMDept]  = useState('')

  // OT export state
  const [otFrom, setOtFrom] = useState(format(subDays(new Date(),30),'yyyy-MM-dd'))
  const [otTo,   setOtTo]   = useState(format(new Date(),'yyyy-MM-dd'))

  const { data: deptList } = useQuery({
    queryKey: queryKeys.employees.departments(),
    queryFn:  employeesApi.departments,
  })

  const handleMonthlyExport = () => {
    const params = { month: mMonth, year: mYear, ...(mDept && { department: mDept }) }
    const fname  = `attendance-${formatMonthYear(Number(mMonth),Number(mYear)).replace(' ','-')}.xlsx`
    download('/exports/monthly-attendance', params, fname)
  }

  const handleOtExport = () => {
    download('/exports/overtime', { dateFrom: otFrom, dateTo: otTo },
      `overtime-${otFrom}-to-${otTo}.xlsx`)
  }

  return (
    <div>
      <PageHeader
        title="Exports"
        subtitle="Download Excel reports for attendance and overtime"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Monthly attendance export */}
        <div className="card p-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-[13.5px] font-semibold text-[#0F172A]">Monthly Attendance Report</h2>
              <p className="text-[11.5px] text-[#64748B] mt-0.5">
                Full attendance summary per employee for a selected month
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-[#334155] mb-1 block">Month</label>
                <select value={mMonth} onChange={e=>setMMonth(e.target.value)}
                  className="form-select h-9 text-[12px] w-full">
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#334155] mb-1 block">Year</label>
                <select value={mYear} onChange={e=>setMYear(e.target.value)}
                  className="form-select h-9 text-[12px] w-full">
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#334155] mb-1 block">Department (optional)</label>
              <select value={mDept} onChange={e=>setMDept(e.target.value)}
                className="form-select h-9 text-[12px] w-full">
                <option value="">All Departments</option>
                {(deptList??[]).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
            <div>
              <p className="text-[11px] text-[#64748B]">Format: Excel (.xlsx)</p>
              <p className="text-[11px] text-[#94A3B8]">
                {formatMonthYear(Number(mMonth), Number(mYear))}{mDept ? ` · ${mDept}` : ''}
              </p>
            </div>
            <ExportButton onClick={handleMonthlyExport} loading={loading} />
          </div>
        </div>

        {/* Overtime export */}
        <div className="card p-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-[#7C3AED]" />
            </div>
            <div>
              <h2 className="text-[13.5px] font-semibold text-[#0F172A]">Overtime Report</h2>
              <p className="text-[11.5px] text-[#64748B] mt-0.5">
                All overtime records within a date range
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-[#334155] mb-1 block">From Date</label>
                <input type="date" value={otFrom} onChange={e=>setOtFrom(e.target.value)}
                  className="form-input h-9 text-[12px] w-full" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#334155] mb-1 block">To Date</label>
                <input type="date" value={otTo} min={otFrom} onChange={e=>setOtTo(e.target.value)}
                  className="form-input h-9 text-[12px] w-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
            <div>
              <p className="text-[11px] text-[#64748B]">Format: Excel (.xlsx)</p>
              <p className="text-[11px] text-[#94A3B8]">{otFrom} → {otTo}</p>
            </div>
            <ExportButton onClick={handleOtExport} loading={loading} label="Export Excel" />
          </div>
        </div>
      </div>
    </div>
  )
}