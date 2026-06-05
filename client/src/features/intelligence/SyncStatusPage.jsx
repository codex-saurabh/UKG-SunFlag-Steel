// src/features/intelligence/SyncStatusPage.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, intelligenceApi } from '@/lib/api/queries'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageSpinner } from '@/shared/ui/Spinner'
import { ErrorState } from '@/shared/ui/ErrorState'
import { useNotify } from '@/shared/hooks/useNotify'
import { useAuth } from '@/shared/hooks/useAuth'
import { formatDate, formatTime } from '@/shared/utils/formatters'
import { RefreshCw, Play, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'

const JOB_META = {
  attendance_live_sync: { label:'Attendance Live Sync',  desc:'Real-time punch data',       icon:'🕐' },
  employees:            { label:'Employee Master Sync',  desc:'Employee profiles',           icon:'👥' },
  leaves:               { label:'Leave Sync',            desc:'Approved leave records',      icon:'📅' },
  shifts:               { label:'Shift Schedule Sync',   desc:'Shift assignments',           icon:'🔄' },
}

const StatusIcon = ({ status, isStale }) => {
  if (isStale)             return <AlertTriangle size={16} className="text-[#D97706]" />
  if (status === 'success') return <CheckCircle   size={16} className="text-[#16A34A]" />
  if (status === 'failed')  return <XCircle       size={16} className="text-[#DC2626]" />
  return <Clock size={16} className="text-[#94A3B8]" />
}

export default function SyncStatusPage() {
  const notify      = useNotify()
  const queryClient = useQueryClient()
  const { isITAdmin } = useAuth()

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.intelligence.syncStatus(),
    queryFn:  intelligenceApi.syncStatus,
    refetchInterval: 30000,
  })

  const runHealth = useMutation({
    mutationFn: intelligenceApi.runSyncHealth,
    onSuccess: () => {
      notify.info('Health check triggered', 'Sync health check running in background.')
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.intelligence.syncStatus() })
        queryClient.invalidateQueries({ queryKey: ['intelligence'] })
      }, 3000)
    },
    onError: () => notify.error('Failed', 'Could not trigger health check.'),
  })

  if (isLoading) return <PageSpinner />
  if (error)     return <ErrorState message={error.message} onRetry={refetch} />

  const jobs     = Array.isArray(data) ? data : []
  const staleCount  = jobs.filter(j => j.isStale).length
  const failedCount = jobs.filter(j => j.lastStatus === 'failed').length
  const healthyCount = jobs.filter(j => !j.isStale && j.lastStatus !== 'failed').length

  return (
    <div>
      <PageHeader
        title="Sync Status"
        subtitle="UKG Pro data feed freshness and health"
        action={
          <div className="flex items-center gap-2">
            {isITAdmin && (
              <button
                onClick={() => runHealth.mutate()}
                disabled={runHealth.isPending}
                className="btn-secondary text-[12px] h-8 px-3 flex items-center gap-1.5"
              >
                <Play size={11} className={runHealth.isPending ? 'animate-pulse' : ''} />
                Run Health Check
              </button>
            )}
            <button onClick={() => refetch()}
              className="btn-secondary text-[12px] h-8 px-3 flex items-center gap-1.5">
              <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Overall health banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-5 border ${
        staleCount > 0 || failedCount > 0
          ? 'bg-[#FFFBEB] border-[#FDE68A]'
          : 'bg-[#F0FDF4] border-[#BBF7D0]'
      }`}>
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          staleCount > 0 || failedCount > 0 ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
        }`} />
        <div>
          <span className={`text-[12.5px] font-semibold ${
            staleCount > 0 || failedCount > 0 ? 'text-[#92400E]' : 'text-[#15803D]'
          }`}>
            {staleCount > 0 || failedCount > 0
              ? `${staleCount + failedCount} job${staleCount + failedCount > 1 ? 's' : ''} need attention`
              : 'All sync jobs healthy'}
          </span>
          <span className="text-[11px] text-[#64748B] ml-2">
            {healthyCount} of {jobs.length} healthy · stale threshold: 30 min
          </span>
        </div>
      </div>

      {/* Job cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {jobs.map((job) => {
          const meta     = JOB_META[job.jobName] ?? { label: job.jobName, desc:'Sync job', icon:'⚙️' }
          const isStale  = job.isStale
          const isFailed = job.lastStatus === 'failed'
          const isOk     = !isStale && !isFailed
          const isSkipped = job.lastStatus === 'skipped'

          return (
            <div key={job.jobName} className={`card p-5 border ${
              isStale  ? 'border-[#FDE68A]' :
              isFailed ? 'border-[#FECACA]' :
              'border-[#E8EAF0]'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-[22px]">{meta.icon}</div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0F172A]">{meta.label}</div>
                    <div className="text-[11px] text-[#64748B]">{meta.desc}</div>
                  </div>
                </div>
                <StatusIcon status={job.lastStatus} isStale={isStale} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-[#64748B]">Status</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isOk && !isSkipped ? 'bg-[#DCFCE7] text-[#15803D]' :
                    isFailed           ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                    isSkipped          ? 'bg-[#F1F5F9] text-[#475569]' :
                    isStale            ? 'bg-[#FEF9C3] text-[#92400E]' :
                    'bg-[#F1F5F9] text-[#475569]'
                  }`}>
                    {isStale ? 'STALE' : (job.lastStatus ?? 'unknown').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-[#64748B]">Last success</span>
                  <span className="text-[11.5px] font-medium text-[#0F172A] font-mono">
                    {job.lastSuccessAt
                      ? `${formatDate(job.lastSuccessAt)} ${formatTime(job.lastSuccessAt)}`
                      : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-[#64748B]">Age</span>
                  <span className={`text-[11.5px] font-semibold font-mono ${
                    job.staleMinutes > 60  ? 'text-[#DC2626]' :
                    job.staleMinutes > 30  ? 'text-[#D97706]' :
                    'text-[#0F172A]'
                  }`}>
                    {job.staleMinutes != null
                      ? job.staleMinutes < 60
                        ? `${job.staleMinutes}m ago`
                        : `${Math.floor(job.staleMinutes/60)}h ${job.staleMinutes%60}m ago`
                      : '—'}
                  </span>
                </div>

                {/* Staleness bar */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#94A3B8]">Freshness</span>
                    <span className="text-[10px] text-[#94A3B8]">30 min threshold</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, ((job.staleMinutes ?? 0) / 30) * 100)}%`,
                        background: isStale ? '#EF4444' : job.staleMinutes > 20 ? '#F59E0B' : '#22C55E',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}