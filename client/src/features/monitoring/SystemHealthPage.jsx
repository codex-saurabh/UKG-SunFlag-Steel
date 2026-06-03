// src/features/monitoring/SystemHealthPage.jsx
import { useQuery } from '@tanstack/react-query'
import { queryKeys, monitoringApi } from '@/lib/api/queries'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageSpinner } from '@/shared/ui/Spinner'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Database, Cpu, HardDrive, Clock, RefreshCw } from 'lucide-react'

const StatusDot = ({ ok }) => (
  <span className={`w-2 h-2 rounded-full inline-block ${ok ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
)

export default function SystemHealthPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.monitoring.health(),
    queryFn:  monitoringApi.health,
    refetchInterval: 30000,
  })

  if (isLoading) return <PageSpinner />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const h = data ?? {}

  const cards = [
    {
      icon: Database,
      label: 'MongoDB',
      status: h.mongodb?.status === 'connected',
      statusLabel: h.mongodb?.status ?? '—',
      bg: '#EFF6FF', color: '#3B82F6',
      details: [
        { label:'Response time', value: h.mongodb?.responseTime ? `${h.mongodb.responseTime}ms` : '—' },
      ],
    },
    {
      icon: Cpu,
      label: 'Memory',
      status: true,
      statusLabel: 'OK',
      bg: '#F0FDF4', color: '#16A34A',
      details: [
        { label:'Used',  value: h.memory?.used  ? `${h.memory.used}MB`  : '—' },
        { label:'Total', value: h.memory?.total ? `${h.memory.total}MB` : '—' },
        { label:'Free',  value: h.memory?.free  ? `${h.memory.free}MB`  : '—' },
      ],
    },
    {
      icon: HardDrive,
      label: 'Disk',
      status: true,
      statusLabel: 'OK',
      bg: '#FFFBEB', color: '#D97706',
      details: [
        { label:'Used',  value: h.disk?.used  ?? '—' },
        { label:'Total', value: h.disk?.total ?? '—' },
        { label:'Free',  value: h.disk?.free  ?? '—' },
      ],
    },
    {
      icon: Clock,
      label: 'Uptime',
      status: true,
      statusLabel: 'Running',
      bg: '#F5F3FF', color: '#7C3AED',
      details: [
        { label:'Server uptime', value: h.uptime ? `${Math.floor(h.uptime/3600)}h ${Math.floor((h.uptime%3600)/60)}m` : '—' },
        { label:'Node version',  value: h.nodeVersion ?? '—' },
      ],
    },
  ]

  return (
    <div>
      <PageHeader
        title="System Health"
        subtitle="Real-time infrastructure status"
        action={
          <button onClick={() => refetch()}
            className="btn-secondary text-[12px] h-8 px-3 flex items-center gap-1.5">
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: c.bg }}>
                  <c.icon size={17} style={{ color: c.color }} />
                </div>
                <span className="text-[13.5px] font-semibold text-[#0F172A]">{c.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot ok={c.status} />
                <span className={`text-[11px] font-medium ${c.status ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
                  {c.statusLabel}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {c.details.map((d) => (
                <div key={d.label} className="flex items-center justify-between py-1.5 border-b border-[#F8FAFC]">
                  <span className="text-[11.5px] text-[#64748B]">{d.label}</span>
                  <span className="text-[11.5px] font-medium text-[#0F172A] font-mono">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
