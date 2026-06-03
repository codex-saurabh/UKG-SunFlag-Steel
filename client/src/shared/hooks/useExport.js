// src/shared/hooks/useExport.js
import { useState } from 'react'
import { downloadBlob } from '@/lib/api/client'
import { useNotify } from './useNotify'

export const useExport = () => {
  const [loading, setLoading] = useState(false)
  const notify = useNotify()

  const download = async (url, params, filename) => {
    setLoading(true)
    try {
      await downloadBlob(url, params, filename)
      notify.success('Export ready', `${filename} downloaded successfully.`)
    } catch (err) {
      notify.error('Export failed', err.response?.data?.error?.message || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return { download, loading }
}