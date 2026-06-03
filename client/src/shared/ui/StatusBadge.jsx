// src/shared/ui/StatusBadge.jsx
import { STATUS_CONFIG } from '@/shared/utils/constants'

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? {
    label: status ?? 'Unknown',
    bg: '#F1F5F9',
    text: '#475569',
    dot: '#94A3B8',
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.dot }}
      />
      {config.label}
    </span>
  )
}

export default StatusBadge