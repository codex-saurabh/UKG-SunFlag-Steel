// src/shared/ui/ExportButton.jsx
import { Download } from 'lucide-react'
import { Spinner } from './Spinner'
import { cn } from '@/shared/utils/cn'

export const ExportButton = ({ onClick, loading, label = 'Export Excel', className, disabled }) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
      'bg-[#0F172A] hover:bg-[#1E293B] text-white',
      (loading || disabled) && 'opacity-60 cursor-not-allowed',
      className
    )}
  >
    {loading ? <Spinner size="sm" className="border-white border-t-white/30" /> : <Download size={14} />}
    {loading ? 'Exporting…' : label}
  </button>
)

export default ExportButton