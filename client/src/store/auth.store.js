// src/store/auth.store.js
import { create } from 'zustand'

const TOKEN_KEY = 'hr_token'
const USER_KEY  = 'hr_user'

// Read persisted state from localStorage on startup
const getPersistedToken = () => localStorage.getItem(TOKEN_KEY) || null
const getPersistedUser  = () => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = create((set) => ({
  token: getPersistedToken(),
  user:  getPersistedUser(),

  // Called after successful login
  setAuth: ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ token, user })
  },

  // Called on logout or 401
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ token: null, user: null })
  },
}))