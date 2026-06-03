// src/shared/ui/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export const Pagination = ({ meta, page, onPageChange }) => {
  if (!meta || meta.total === 0) return null

  const { total, pages, hasNext, hasPrev } = meta

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
      <span className="text-[11.5px] text-[#64748B]">
        Page <span className="font-medium text-[#0F172A]">{page}</span> of{' '}
        <span className="font-medium text-[#0F172A]">{pages}</span>
        {' — '}
        <span className="font-medium text-[#0F172A]">{total.toLocaleString()}</span> total
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 text-[11.5px] font-medium rounded-lg border transition-colors',
            hasPrev
              ? 'border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC]'
              : 'border-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
          )}
        >
          <ChevronLeft size={13} />
          Previous
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 text-[11.5px] font-medium rounded-lg border transition-colors',
            hasNext
              ? 'border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC]'
              : 'border-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
          )}
        >
          Next
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

export default Pagination