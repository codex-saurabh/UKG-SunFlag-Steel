// src/features/monitoring/JobsPage.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, monitoringApi } from '@/lib/api/queries'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageSpinner } from '@/shared/ui/Spinner'
import { ErrorState } from '@/shared/ui/ErrorState'
import { useNotify } from '@/shared/hooks/useNotify'
import { formatDate, formatTime } from '@/shared/utils/formatters'
import { Play, RefreshCw } from 'lucide-react'
import { JOB_NAMES } from '@/shared/utils/constants'

export default function JobsPage() {
  const notify       = useNotify()
  const queryClient  = useQueryClient()

  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.monitoring.jobs(),
    queryFn:  monitoringApi.jobs,
    refetchInterval: 30000,
  })

  const { data: logs } = useQuery({
    queryKey: queryKeys.monitoring.jobLogs(),
    queryFn:  () => monitoringApi.jobLogs(),
  })

  const triggerMutation = useMutation({
    mutationFn: monitoringApi.triggerJob,
    onSuccess: (_, jobName) => {
      notify.success('Job triggered', `${jobName} has been queued.`)
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.jobs() })
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.jobLogs() })
    },
    onError: (err, jobName) => {
      notify.error('Trigger failed', err.response?.data?.error?.message ?? `Could not trigger ${jobName}.`)
    },
  })

  if (isLoading) return <PageSpinner />
  if (error)     return <ErrorState message={error.message} onRetry={refetch} />

  const jobList  = Array.isArray(jobs) ? jobs : Object.entries(jobs ?? {}).map(([name, val]) => ({ jobName: name, ...val }))
  const logList  = Array.isArray(logs) ? logs.slice(0, 20) : []

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Scheduled sync job status and manual triggers"
        action={
          <button onClick={() => refetch()} className="btn-secondary text-[12px] h-8 px-3 flex items-center gap-1.5">
            <RefreshCw size={12} />Refresh
          </button>
        }
      />

      {/* Job status cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {JOB_NAMES.map((name) => {
          const job = jobList.find(j => (j.jobName ?? j.name) === name) ?? {}
          const ok  = job.status === 'success'
          const failed = job.status === 'failed'
          return (
            <div key={name} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[11px] font-mono text-[#64748B]">{name}</span>
                <span className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${ok?'bg-[#22C55E]':failed?'bg-[#EF4444]':'bg-[#F59E0B]'}`} />
              </div>
              <div className={`text-[12px] font-semibold mb-2 ${ok?'text-[#15803D]':failed?'text-[#B91C1C]':'text-[#92400E]'}`}>
                {job.status ?? 'Unknown'}
              </div>
              <div className="text-[10.5px] text-[#94A3B8] mb-3">
                Last: {job.endTime ? `${formatDate(job.endTime)} ${formatTime(job.endTime)}` : 'Never'}
              </div>
              <button
                onClick={() => triggerMutation.mutate(name)}
                disabled={triggerMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 rounded-lg border border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC] transition-colors"
              >
                <Play size={11} />Trigger
              </button>
            </div>
          )
        })}
      </div>

      {/* Recent logs */}
      {logList.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F1F5F9]">
            <h2 className="text-[13px] font-semibold text-[#0F172A]">Recent Job Logs</h2>
          </div>
          <table className="data-table">
            <thead><tr><th>Job</th><th>Status</th><th>Started</th><th>Ended</th><th>Records</th><th>Message</th></tr></thead>
            <tbody>
              {logList.map((l, i) => (
                <tr key={i}>
                  <td className="font-mono text-[11px]">{l.jobName ?? l.name}</td>
                  <td>
                    <span className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                      l.status==='success'?'bg-[#DCFCE7] text-[#15803D]':
                      l.status==='failed' ?'bg-[#FEE2E2] text-[#B91C1C]':
                      'bg-[#FEF9C3] text-[#92400E]'
                    }`}>{l.status}</span>
                  </td>
                  <td className="text-[#64748B]">{formatTime(l.startTime ?? l.createdAt)}</td>
                  <td className="text-[#64748B]">{l.endTime ? formatTime(l.endTime) : '—'}</td>
                  <td>{l.recordsProcessed ?? '—'}</td>
                  <td className="text-[#64748B] max-w-[200px] truncate text-[11px]">{l.message ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}