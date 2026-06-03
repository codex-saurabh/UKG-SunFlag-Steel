// src/lib/api/client.js
import axios from 'axios'

const BASE_URL = '/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Request interceptor: attach Bearer token ──────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hr_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 globally ────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hr_token')
      localStorage.removeItem('hr_user')
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Blob download helper (for export endpoints) ───────────────────────────
export const downloadBlob = async (url, params, filename) => {
  const token = localStorage.getItem('hr_token')
  const response = await axios.get(`${BASE_URL}${url}`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
    timeout: 60000,
  })

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.parentNode.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}

export default apiClient