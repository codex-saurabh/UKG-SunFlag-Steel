// src/shared/ui/ErrorState.jsx
import { AlertTriangle, RefreshCw } from 'lucide-react'

export const ErrorState = ({ message = 'Something went wrong.', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center mb-3">
      <AlertTriangle size={22} className="text-[#B91C1C]" />
    </div>
    <p className="text-[13px] font-medium text-[#334155]">Failed to load data</p>
    <p className="text-[12px] text-[#94A3B8] mt-1 max-w-xs">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-brand-500 hover:text-brand-600 font-medium"
      >
        <RefreshCw size={12} />
        Try again
      </button>
    )}
  </div>
)

export default ErrorState