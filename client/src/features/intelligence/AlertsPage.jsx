// src/features/intelligence/AlertsPage.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { queryKeys, intelligenceApi } from '@/lib/api/queries'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { SkeletonTable } from '@/shared/ui/SkeletonRow'
import { FiltersBar, FilterSelect } from '@/shared/ui/FiltersBar'
import { useNotify } from '@/shared/hooks/useNotify'
import { useAuth } from '@/shared/hooks/useAuth'
import { formatDate, formatTime } from '@/shared/utils/formatters'
import { AlertTriangle, ShieldAlert, Info, X, RefreshCw } from 'lucide-react'

const SEVERITY_CONFIG = {
  critical: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444', icon: ShieldAlert },
  warning:  { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B', icon: AlertTriangle },
  info:     { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6', icon: Info },
}

const TYPE_LABELS = {
  consecutive_absence: 'Consecutive Absence',
  sync_stale:          'Sync Stale',
}

export default function AlertsPage() {
  const [severity, setSeverity] = useState('')
  const [type,     setType]     = useState('')
  const notify      = useNotify()
  const queryClient = useQueryClient()
  const { isITAdmin, isHRAdmin } = useAuth()
  const canDismiss = isITAdmin || isHRAdmin

  const filters = {
    severity: severity || undefined,
    type:     type     || undefined,
  }

  const { data: alerts, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.intelligence.alerts(filters),
    queryFn:  () => intelligenceApi.alerts(filters),
    refetchInterval: 60000,
  })

  const { data: summary } = useQuery({
    queryKey: queryKeys.intelligence.summary(),
    queryFn:  intelligenceApi.alertsSummary,
    refetchInterval: 60000,
  })

  const dismissMutation = useMutation({
    mutationFn: intelligenceApi.dismissAlert,
    onSuccess: () => {
      notify.success('Alert dismissed', 'The alert has been resolved.')
      queryClient.invalidateQueries({ queryKey: ['intelligence'] })
    },
    onError: (err) => {
      notify.error('Failed', err.response?.data?.error?.message ?? 'Could not dismiss alert.')
    },
  })

  const runAbsenceScan = useMutation({
    mutationFn: intelligenceApi.runConsecutiveAbsence,
    onSuccess: () => {
      notify.info('Scan triggered', 'Consecutive absence scan running. Check back in a few seconds.')
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['intelligence'] }), 4000)
    },
    onError: () => notify.error('Failed', 'Could not trigger scan.'),
  })

  const list = alerts ?? []

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle="Active system and attendance alerts"
        action={
          <div className="flex items-center gap-2">
            {isITAdmin && (
              <button
                onClick={() => runAbsenceScan.mutate()}
                disabled={runAbsenceScan.isPending}
                className="btn-secondary text-[12px] h-8 px-3 flex items-center gap-1.5"
              >
                <RefreshCw size={12} className={runAbsenceScan.isPending ? 'animate-spin' : ''} />
                Run Absence Scan
              </button>
            )}
            <button onClick={() => refetch()}
              className="btn-secondary text-[12px] h-8 px-3 flex items-center gap-1.5">
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Summary badges */}
      {summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
          {[
            { key:'total',    label:'Total Alerts',    bg:'#F8FAFC', border:'#E2E8F0', text:'#0F172A',  dot:'#64748B' },
            { key:'critical', label:'Critical',        bg:'#FEF2F2', border:'#FECACA', text:'#B91C1C',  dot:'#EF4444' },
            { key:'warning',  label:'Warning',         bg:'#FFFBEB', border:'#FDE68A', text:'#92400E',  dot:'#F59E0B' },
            { key:'info',     label:'Info',            bg:'#EFF6FF', border:'#BFDBFE', text:'#1E40AF',  dot:'#3B82F6' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSeverity(s.key === 'total' ? '' : s.key)}
              className="card p-4 text-left transition-all hover:shadow-card-hover"
              style={severity === (s.key === 'total' ? '' : s.key) ? { borderColor: s.dot, boxShadow: `0 0 0 2px ${s.dot}22` } : {}}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                <span className="text-[11px] font-medium" style={{ color: s.text }}>{s.label}</span>
              </div>
              <div className="text-[26px] font-bold" style={{ color: s.text }}>
                {summary[s.key] ?? 0}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <FiltersBar
        onReset={() => { setSeverity(''); setType('') }}
        hasActiveFilters={!!(severity || type)}
      >
        <FilterSelect
          value={severity} onChange={setSeverity}
          options={[
            { value:'critical', label:'Critical' },
            { value:'warning',  label:'Warning' },
            { value:'info',     label:'Info' },
          ]}
          placeholder="All Severities" className="w-36"
        />
        <FilterSelect
          value={type} onChange={setType}
          options={[
            { value:'consecutive_absence', label:'Consecutive Absence' },
            { value:'sync_stale',          label:'Sync Stale' },
          ]}
          placeholder="All Types" className="w-48"
        />
      </FiltersBar>

      {/* Alerts list */}
      {isLoading ? (
        <div className="card overflow-hidden">
          <table className="data-table"><tbody><SkeletonTable rows={6} cols={5} /></tbody></table>
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : list.length === 0 ? (
        <EmptyState title="No active alerts" message="All systems are operating normally." />
      ) : (
        <div className="space-y-2">
          {list.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info
            const Icon = cfg.icon
            return (
              <div
                key={alert._id}
                className="flex items-start gap-4 p-4 rounded-xl border transition-all"
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'white', border: `1px solid ${cfg.border}` }}>
                  <Icon size={15} style={{ color: cfg.dot }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'white', color: cfg.text, border: `1px solid ${cfg.border}` }}
                    >
                      {alert.severity?.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      {TYPE_LABELS[alert.type] ?? alert.type}
                    </span>
                    <span className="text-[10.5px] text-[#94A3B8]">·</span>
                    <span className="text-[10.5px] text-[#94A3B8]">
                      {formatDate(alert.createdAt)} {formatTime(alert.createdAt)}
                    </span>
                  </div>
                  <p className="text-[12.5px] font-medium" style={{ color: cfg.text }}>
                    {alert.message ?? alert.title ?? 'Alert'}
                  </p>
                  {alert.employeeName && (
                    <p className="text-[11.5px] text-[#64748B] mt-0.5">
                      Employee: <span className="font-medium text-[#334155]">{alert.employeeName}</span>
                      {alert.employeeCode && <span className="text-[#94A3B8]"> · {alert.employeeCode}</span>}
                      {alert.consecutiveDays && <span> · {alert.consecutiveDays} consecutive days absent</span>}
                    </p>
                  )}
                  {alert.details && (
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">{alert.details}</p>
                  )}
                </div>

                {canDismiss && (
                  <button
                    onClick={() => dismissMutation.mutate(alert._id)}
                    disabled={dismissMutation.isPending}
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white"
                    title="Dismiss alert"
                  >
                    <X size={13} style={{ color: cfg.text }} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}