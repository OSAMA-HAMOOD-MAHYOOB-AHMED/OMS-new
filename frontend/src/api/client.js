import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

