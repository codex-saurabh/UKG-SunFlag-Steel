// src/shared/ui/FiltersBar.jsx
import { Search, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export const FiltersBar = ({ children, onReset, hasActiveFilters, className }) => (
  <div className={cn('card p-3 mb-4', className)}>
    <div className="flex items-center gap-3 flex-wrap">
      {children}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-[11.5px] text-[#64748B] hover:text-[#EF4444] ml-auto transition-colors"
        >
          <X size={12} />
          Clear filters
        </button>
      )}
    </div>
  </div>
)

export const SearchInput = ({ value, onChange, placeholder = 'Search…', className }) => (
  <div className={cn('relative', className)}>
    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="form-input pl-8 h-8 text-[12px] w-full"
    />
  </div>
)

export const FilterSelect = ({ value, onChange, options, placeholder, className }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={cn('form-select h-8 text-[12px] pr-8', className)}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((opt) => (
      <option key={opt.value ?? opt} value={opt.value ?? opt}>
        {opt.label ?? opt}
      </option>
    ))}
  </select>
)

export default FiltersBar