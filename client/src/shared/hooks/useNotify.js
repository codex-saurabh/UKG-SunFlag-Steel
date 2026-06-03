// src/shared/hooks/useNotify.js
import { useUiStore } from '@/store/ui.store'

export const useNotify = () => {
  const addNotification = useUiStore((s) => s.addNotification)

  return {
    success: (title, message) => addNotification({ type: 'success', title, message }),
    error:   (title, message) => addNotification({ type: 'error',   title, message }),
    warning: (title, message) => addNotification({ type: 'warning', title, message }),
    info:    (title, message) => addNotification({ type: 'info',    title, message }),
  }
}