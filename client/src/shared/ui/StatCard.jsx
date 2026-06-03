// src/shared/ui/StatCard.jsx
import { cn } from '@/shared/utils/cn'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export const StatCard = ({
  label,
  value,
  subLabel,
  delta,      // number (positive = up, negative = down, 0 = neutral)
  deltaLabel, // text override for delta label
  icon: Icon,
  iconBg = '#EFF6FF',
  iconColor = '#3B82F6',
  className,
}) => {
  const showDelta = delta !== undefined && delta !== null
  const isUp   = showDelta && delta > 0
  const isDown = showDelta && delta < 0

  return (
    <div className={cn('card p-4 flex flex-col', className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-medium text-[#64748B] leading-tight">{label}</span>
        {Icon && (
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            <Icon size={17} style={{ color: iconColor }} />
          </div>
        )}
      </div>

      <div className="text-[26px] font-bold text-[#0F172A] leading-none mb-1.5">
        {value ?? '—'}
      </div>

      <div className="flex items-center gap-1 mt-auto">
        {showDelta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-medium',
              isUp   && 'text-[#16A34A]',
              isDown && 'text-[#DC2626]',
              !isUp && !isDown && 'text-[#64748B]'
            )}
          >
            {isUp   && <TrendingUp  size={12} />}
            {isDown && <TrendingDown size={12} />}
            {!isUp && !isDown && <Minus size={12} />}
            {deltaLabel ?? `${Math.abs(delta)}%`}
          </span>
        )}
        {!showDelta && subLabel && (
          <span className="text-[11px] text-[#64748B]">{subLabel}</span>
        )}
      </div>
    </div>
  )
}

export default StatCard