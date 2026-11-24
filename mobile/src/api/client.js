import axios from 'axios'
import { API_URL } from '../config'

// Token and session-expiry handler are injected by AuthContext so this module
// has no React dependency.
let authToken = null
let onUnauthorized = null

export function setAuthToken(token) {
  authToken = token || null
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export const api = axios.create({
  baseURL: API_URL,
  // Render's free tier can take a while to wake up.
  timeout: 90_000,
})

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = String(error?.config?.url || '')
    const isAuthCall = url.includes('/api/auth/')
    if (status === 401 && !isAuthCall && authToken && onUnauthorized) {
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)

export function authHeader() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {}
}
