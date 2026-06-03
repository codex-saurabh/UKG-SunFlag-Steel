// src/shared/hooks/useAuth.js
import { useAuthStore } from '@/store/auth.store'
import { ROLES } from '@/shared/utils/constants'

export const useAuth = () => {
  const { token, user, setAuth, logout } = useAuthStore()

  const isAuthenticated = !!token && !!user
  const role = user?.role ?? null

  const isITAdmin    = role === ROLES.IT_ADMIN
  const isHRAdmin    = role === ROLES.HR_ADMIN
  const isTimeOffice = role === ROLES.TIME_OFFICE

  // Check if role is in the allowed list
  const hasRole = (...allowedRoles) => allowedRoles.includes(role)

  return {
    token,
    user,
    role,
    isAuthenticated,
    isITAdmin,
    isHRAdmin,
    isTimeOffice,
    hasRole,
    setAuth,
    logout,
  }
}