// src/features/monitoring/AuditLogsPage.jsx
import { useQuery } from '@tanstack/react-query'
import { queryKeys, monitoringApi } from '@/lib/api/queries'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageSpinner } from '@/shared/ui/Spinner'
import { ErrorState } from '@/shared/ui/ErrorState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { formatDate, formatTime } from '@/shared/utils/formatters'
import { useAuth } from '@/shared/hooks/useAuth'

export default function AuditLogsPage() {
  const { isITAdmin } = useAuth()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.monitoring.auditLogs(),
    queryFn:  monitoringApi.auditLogs,
  })

  if (isLoading) return <PageSpinner />
  if (error)     return <ErrorState message={error.message} onRetry={refetch} />

  const logs = Array.isArray(data) ? data : []

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="System activity and access trail"
      />

      {!isITAdmin && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4"
          style={{ background:'#EFF6FF', border:'1px solid #BFDBFE' }}>
          <span className="text-[12px] text-[#1D4ED8]">
            Read-only access — granted by IT Admin
          </span>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={6}><EmptyState title="No audit logs" /></td></tr>
            )}
            {logs.map((l, i) => (
              <tr key={i}>
                <td>{formatDate(l.timestamp ?? l.createdAt)}</td>
                <td className="font-mono text-[11px]">{formatTime(l.timestamp ?? l.createdAt)}</td>
                <td className="font-medium">{l.user ?? l.userName ?? '—'}</td>
                <td>
                  <span className="inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569]">
                    {l.action ?? '—'}
                  </span>
                </td>
                <td className="text-[#64748B] font-mono text-[11px]">{l.resource ?? l.endpoint ?? '—'}</td>
                <td className="font-mono text-[11px] text-[#94A3B8]">{l.ip ?? l.ipAddress ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}