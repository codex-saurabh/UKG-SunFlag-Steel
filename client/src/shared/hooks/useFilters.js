// src/shared/hooks/useFilters.js
import { useState, useCallback } from 'react'

export const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1) // reset to page 1 on any filter change
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
    setPage(1)
  }, [initialFilters])

  const setMultiple = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1)
  }, [])

  return { filters, setFilter, resetFilters, setMultiple, page, setPage }
}