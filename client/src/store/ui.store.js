// src/store/ui.store.js
import { create } from 'zustand'

let notifId = 0

export const useUiStore = create((set) => ({
  sidebarOpen: true,
  notifications: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Add a toast notification
  // type: 'success' | 'error' | 'warning' | 'info'
  addNotification: ({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++notifId
    set((s) => ({
      notifications: [...s.notifications, { id, type, title, message }],
    }))
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        }))
      }, duration)
    }
    return id
  },

  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
}))