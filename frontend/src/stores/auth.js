import { defineStore } from 'pinia'
import { api } from '../api/client'

const STORAGE_KEY = 'oms_auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    email: null,
    role: null,
    loading: false,
    error: null,
  }),
  actions: {
    hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        this.token = parsed.token || null
        this.email = parsed.email || null
        this.role = parsed.role || null
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: this.token, email: this.email, role: this.role }),
      )
    },
    clear() {
      this.token = null
      this.email = null
      this.role = null
      this.error = null
      localStorage.removeItem(STORAGE_KEY)
    },
    async login({ email, password }) {
      this.loading = true
      this.error = null
      try {
        const res = await api.post('/api/auth/login', { email, password })
        this.token = res.data.token
        this.email = res.data.email
        this.role = res.data.role
        this.persist()
        return true
      } catch (e) {
        this.error = e?.response?.data || 'Login failed'
        return false
      } finally {
        this.loading = false
      }
    },
    async register(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await api.post('/api/auth/register', payload)
        this.token = res.data.token
        this.email = res.data.email
        this.role = res.data.role
        this.persist()
        return true
      } catch (e) {
        this.error = e?.response?.data || 'Registration failed'
        return false
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.clear()
    },
  },
})

