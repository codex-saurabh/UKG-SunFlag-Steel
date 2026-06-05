// src/lib/api/queries.js
import apiClient from './client'

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEY FACTORIES
// ─────────────────────────────────────────────────────────────────────────────
export const queryKeys = {
  // Auth
  auth: {
    me: () => ['auth', 'me'],
  },

  // Analytics
  analytics: {
    dashboard: ()          => ['analytics', 'dashboard'],
    trend:     (days)      => ['analytics', 'trend', days],
    shiftBreakdown: (m, y) => ['analytics', 'shift-breakdown', m, y],
    deptRate:  (m, y)      => ['analytics', 'dept-rate', m, y],
  },

  // Attendance
  attendance: {
    today:    ()           => ['attendance', 'today'],
    daily:    (filters)    => ['attendance', 'daily', filters],
    monthly:  (filters)    => ['attendance', 'monthly', filters],
    deptBreakdown: (m, y)  => ['attendance', 'dept-breakdown', m, y],
    missPunch: (filters)   => ['attendance', 'miss-punch', filters],
    overtime:  (filters)   => ['attendance', 'overtime', filters],
  },

  // Employees
  employees: {
    list:        (filters) => ['employees', 'list', filters],
    detail:      (code)    => ['employees', 'detail', code],
    departments: ()        => ['employees', 'departments'],
  },

  // Intelligence
  intelligence: {
    alerts:       (filters) => ['intelligence', 'alerts', filters],
    summary:      ()        => ['intelligence', 'alerts', 'summary'],
    liveHeadcount: ()       => ['intelligence', 'live-headcount'],
    syncStatus:   ()        => ['intelligence', 'sync-status'],
  },

  // Monitoring
  monitoring: {
    health:   () => ['monitoring', 'health'],
    jobs:     () => ['monitoring', 'jobs'],
    jobLogs:  (status) => ['monitoring', 'job-logs', status],
    auditLogs: () => ['monitoring', 'audit-logs'],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCHER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: async ({ email, password }) => {
    const { data } = await apiClient.post('/auth/login', { email, password })
    return data.data // { token, user }
  },

  me: async () => {
    const { data } = await apiClient.get('/auth/me')
    return data.data
  },
}

// ── Analytics ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: async () => {
    const { data } = await apiClient.get('/analytics/dashboard')
    return data.data
  },

  trend: async (days = 30) => {
    const { data } = await apiClient.get('/analytics/trend', { params: { days } })
    return data.data
  },

  shiftBreakdown: async (month, year) => {
    const { data } = await apiClient.get('/analytics/shift-breakdown', {
      params: { month, year },
    })
    return data.data
  },

  deptRate: async (month, year) => {
    const { data } = await apiClient.get('/analytics/dept-rate', {
      params: { month, year },
    })
    return data.data
  },
}

// ── Attendance ────────────────────────────────────────────────────────────
export const attendanceApi = {
  today: async () => {
    const { data } = await apiClient.get('/attendance/today')
    return data.data
  },

  daily: async (filters = {}) => {
    // Strip undefined/null/empty values
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
    const { data } = await apiClient.get('/attendance/daily', { params })
    return data // includes { data, meta }
  },

  monthly: async (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
    const { data } = await apiClient.get('/attendance/monthly', { params })
    return data
  },

  deptBreakdown: async (month, year) => {
    const { data } = await apiClient.get('/attendance/department-breakdown', {
      params: { month, year },
    })
    return data.data
  },

  missPunch: async (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
    const { data } = await apiClient.get('/attendance/miss-punch', { params })
    return data
  },

  overtime: async (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
    const { data } = await apiClient.get('/attendance/overtime', { params })
    return data
  },
}

// ── Employees ─────────────────────────────────────────────────────────────
export const employeesApi = {
  list: async (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
    const { data } = await apiClient.get('/employees', { params })
    return data
  },

  detail: async (empCode) => {
    const { data } = await apiClient.get(`/employees/${empCode}`)
    return data.data
  },

  departments: async () => {
    const { data } = await apiClient.get('/employees/departments')
    return data.data
  },
}

// ── Monitoring ────────────────────────────────────────────────────────────
export const monitoringApi = {
  health: async () => {
    const { data } = await apiClient.get('/monitoring/health')
    return data.data
  },

  jobs: async () => {
    const { data } = await apiClient.get('/monitoring/jobs')
    return data.data
  },

  jobLogs: async (status) => {
    const params = status ? { status } : {}
    const { data } = await apiClient.get('/monitoring/job-logs', { params })
    return data.data
  },

  auditLogs: async () => {
    const { data } = await apiClient.get('/monitoring/audit-logs')
    return data.data
  },

  triggerJob: async (jobName) => {
    const { data } = await apiClient.post(`/monitoring/jobs/trigger/${jobName}`)
    return data
  },
}

// ── Intelligence (new) ────────────────────────────────────────────────────
export const intelligenceApi = {
  alerts: async (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
    const { data } = await apiClient.get('/intelligence/alerts', { params })
    return data.data
  },

  alertsSummary: async () => {
    const { data } = await apiClient.get('/intelligence/alerts/summary')
    return data.data // { critical, warning, info, total }
  },

  dismissAlert: async (alertId) => {
    const { data } = await apiClient.patch(`/intelligence/alerts/${alertId}/dismiss`)
    return data
  },

  liveHeadcount: async () => {
    const { data } = await apiClient.get('/intelligence/live-headcount')
    return data.data // { asOf, overall, byShift, activeShifts }
  },

  syncStatus: async () => {
    const { data } = await apiClient.get('/intelligence/sync-status')
    return data.data // array of { jobName, lastStatus, isStale, staleMinutes }
  },

  runConsecutiveAbsence: async () => {
    const { data } = await apiClient.post('/intelligence/run/consecutive-absence')
    return data
  },

  runSyncHealth: async () => {
    const { data } = await apiClient.post('/intelligence/run/sync-health')
    return data
  },
}

