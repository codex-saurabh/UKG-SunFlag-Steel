// src/shared/ui/NotificationToast.jsx
import { useUiStore } from '@/store/ui.store'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

const ICONS = {
  success: { Icon: CheckCircle,   color: 'text-[#16A34A]', bg: '#F0FDF4', border: '#BBF7D0' },
  error:   { Icon: XCircle,       color: 'text-[#B91C1C]', bg: '#FEF2F2', border: '#FECACA' },
  warning: { Icon: AlertTriangle, color: 'text-[#D97706]', bg: '#FFFBEB', border: '#FDE68A' },
  info:    { Icon: Info,          color: 'text-[#1D4ED8]', bg: '#EFF6FF', border: '#BFDBFE' },
}

export const NotificationToast = () => {
  const notifications   = useUiStore((s) => s.notifications)
  const removeNotification = useUiStore((s) => s.removeNotification)

  if (!notifications.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((n) => {
        const { Icon, color, bg, border } = ICONS[n.type] ?? ICONS.info
        return (
          <div
            key={n.id}
            className="flex items-start gap-3 p-3.5 rounded-xl border shadow-lg"
            style={{ backgroundColor: bg, borderColor: border }}
          >
            <Icon size={16} className={cn('flex-shrink-0 mt-0.5', color)} />
            <div className="flex-1 min-w-0">
              {n.title && (
                <p className="text-[12.5px] font-semibold text-[#0F172A]">{n.title}</p>
              )}
              {n.message && (
                <p className="text-[11.5px] text-[#64748B] mt-0.5">{n.message}</p>
              )}
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="flex-shrink-0 text-[#94A3B8] hover:text-[#334155] mt-0.5"
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default NotificationToast