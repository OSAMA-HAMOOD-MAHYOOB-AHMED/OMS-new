import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8080')

export const api = axios.create({
  baseURL,
  timeout: 120_000,
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status !== 401) return Promise.reject(error)

    const url = String(error.config?.url || '')
    if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
      return Promise.reject(error)
    }

    const auth = useAuthStore()
    auth.clear()

    const next = `${window.location.pathname}${window.location.search}`
    const params = new URLSearchParams({ next, reason: 'session-expired' })
    window.location.assign(`/login?${params.toString()}`)

    return Promise.reject(error)
  },
)

