// src/shared/ui/EmptyState.jsx
import { FileSearch } from 'lucide-react'

export const EmptyState = ({ title = 'No records found', message = 'Try adjusting your filters.' }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
      <FileSearch size={22} className="text-[#94A3B8]" />
    </div>
    <p className="text-[13px] font-medium text-[#334155]">{title}</p>
    <p className="text-[12px] text-[#94A3B8] mt-1">{message}</p>
  </div>
)

export default EmptyState