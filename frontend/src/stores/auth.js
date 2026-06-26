import { defineStore } from 'pinia'
import { api } from '../api/client'
import { formatApiError } from '../utils/apiError'
import { useCartStore } from './cart'

const STORAGE_KEY = 'oms_auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    email: null,
    role: null,
    emailVerified: false,
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
        this.emailVerified = parsed.emailVerified ?? false
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: this.token,
          email: this.email,
          role: this.role,
          emailVerified: this.emailVerified,
        }),
      )
    },
    markEmailVerified() {
      this.emailVerified = true
      this.persist()
    },
    clear() {
      this.token = null
      this.email = null
      this.role = null
      this.emailVerified = false
      this.error = null
      localStorage.removeItem(STORAGE_KEY)
    },
    async login({ email, password }) {
      this.loading = true
      this.error = null
      try {
        const res = await api.post('/api/auth/login', {
          email: String(email ?? '').trim().toLowerCase(),
          password: String(password ?? '').trim(),
        })
        const previousEmail = this.email
        this.token = res.data.token
        this.email = res.data.email
        this.role = res.data.role
        this.emailVerified = res.data.emailVerified ?? false
        this.persist()
        if (previousEmail !== res.data.email) {
          useCartStore().clear()
        }
        return 'ok'
      } catch (e) {
        if (e?.response?.status === 403) {
          this.error = formatApiError(e)
          return 'unverified'
        }
        this.error = formatApiError(e)
        return 'failed'
      } finally {
        this.loading = false
      }
    },
    async register(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await api.post('/api/auth/register', {
          ...payload,
          email: String(payload?.email ?? '').trim().toLowerCase(),
          password: String(payload?.password ?? '').trim(),
          name: String(payload?.name ?? '').trim(),
          phone: String(payload?.phone ?? '').trim(),
          address: String(payload?.address ?? '').trim(),
          role: String(payload?.role ?? '').trim(),
        })
        return { ok: true, email: res.data.email, message: res.data.message }
      } catch (e) {
        this.error = formatApiError(e)
        return { ok: false }
      } finally {
        this.loading = false
      }
    },
    async resendVerification(emailArg) {
      const target = String(emailArg || this.email || '').trim().toLowerCase()
      if (!target) return false
      this.loading = true
      this.error = null
      try {
        await api.post('/api/auth/resend-verification', { email: target })
        return true
      } catch (e) {
        this.error = formatApiError(e)
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
