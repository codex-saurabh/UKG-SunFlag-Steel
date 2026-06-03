// src/shared/utils/constants.js

// Status configuration — single source of truth for colors + labels
export const STATUS_CONFIG = {
  Present: {
    label: 'Present',
    bg:    '#DCFCE7',
    text:  '#15803D',
    dot:   '#22C55E',
  },
  Absent: {
    label: 'Absent',
    bg:    '#FEE2E2',
    text:  '#B91C1C',
    dot:   '#EF4444',
  },
  'Miss Punch': {
    label: 'Miss Punch',
    bg:    '#FEF9C3',
    text:  '#92400E',
    dot:   '#F59E0B',
  },
  Leave: {
    label: 'Leave',
    bg:    '#DBEAFE',
    text:  '#1D4ED8',
    dot:   '#3B82F6',
  },
  Overtime: {
    label: 'Overtime',
    bg:    '#F3E8FF',
    text:  '#7C3AED',
    dot:   '#8B5CF6',
  },
  Holiday: {
    label: 'Holiday',
    bg:    '#F0FDF4',
    text:  '#166534',
    dot:   '#16A34A',
  },
  'Week Off': {
    label: 'Week Off',
    bg:    '#F8FAFC',
    text:  '#64748B',
    dot:   '#94A3B8',
  },
}

// Role definitions
export const ROLES = {
  IT_ADMIN:    'IT_ADMIN',
  HR_ADMIN:    'HR_ADMIN',
  TIME_OFFICE: 'TIME_OFFICE',
}

// Which routes each role can access
export const ROLE_ROUTES = {
  IT_ADMIN:    ['/dashboard', '/attendance', '/analytics', '/employees', '/exports', '/monitoring', '/admin'],
  HR_ADMIN:    ['/dashboard', '/attendance', '/analytics', '/employees', '/exports', '/audit-logs'],
  TIME_OFFICE: ['/dashboard', '/attendance', '/employees'],
}

// Shift codes used in the plant
export const SHIFTS = ['A', 'B', 'C', 'G']

// Department list (also fetched from API — this is a fallback)
export const DEPARTMENTS_FALLBACK = [
  'Blast Furnace',
  'Rolling Mill',
  'Steel Melting',
  'Maintenance',
  'Quality',
  'HR',
  'Finance',
  'IT',
]

// Pagination default
export const PAGE_SIZE = 50

// Job names for manual trigger
export const JOB_NAMES = ['attendance-live', 'employees', 'leaves', 'shifts']

// Chart colors
export const CHART_COLORS = {
  present:   '#22C55E',
  absent:    '#EF4444',
  missPunch: '#F59E0B',
  leave:     '#3B82F6',
  overtime:  '#8B5CF6',
}