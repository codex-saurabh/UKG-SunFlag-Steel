// src/shared/ui/Spinner.jsx
import { cn } from '@/shared/utils/cn'

export const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-4',
  }

  return (
    <div
      className={cn(
        'rounded-full border-[#E2E8F0] border-t-brand-500 animate-spin',
        sizes[size] ?? sizes.md,
        className
      )}
    />
  )
}

export const PageSpinner = () => (
  <div className="flex items-center justify-center h-full min-h-[300px]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-[#64748B]">Loading…</p>
    </div>
  </div>
)

export default Spinner