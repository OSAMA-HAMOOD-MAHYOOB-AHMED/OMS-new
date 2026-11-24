import * as SecureStore from 'expo-secure-store'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setAuthToken, setUnauthorizedHandler } from '../api/client'
import { formatApiError } from '../utils/apiError'

const SESSION_KEY = 'oms_session'

export const ROLES = {
  Customer: 'Customer',
  Sales: 'Retail Salesperson',
  Warehouse: 'Warehouse Manager',
  Admin: 'Admin',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // session: { token, email, role, emailVerified } | null
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  const applySession = useCallback(async (next) => {
    setAuthToken(next?.token)
    setSession(next)
    if (next) await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next))
    else await SecureStore.deleteItemAsync(SESSION_KEY)
  }, [])

  const logout = useCallback(() => applySession(null), [applySession])

  // Restore the saved session on app start.
  useEffect(() => {
    ;(async () => {
      try {
        const raw = await SecureStore.getItemAsync(SESSION_KEY)
        if (raw) {
          const saved = JSON.parse(raw)
          setAuthToken(saved.token)
          setSession(saved)
        }
      } catch {
        await SecureStore.deleteItemAsync(SESSION_KEY)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  // Any 401 from an authenticated call signs the user out.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSessionExpired(true)
      applySession(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [applySession])

  // Returns { status: 'ok' | 'unverified' | 'failed', message? }
  const login = useCallback(
    async (email, password) => {
      try {
        const res = await api.post('/api/auth/login', {
          email: String(email ?? '').trim().toLowerCase(),
          password: String(password ?? '').trim(),
        })
        setSessionExpired(false)
        await applySession({
          token: res.data.token,
          email: res.data.email,
          role: res.data.role,
          emailVerified: res.data.emailVerified ?? false,
        })
        return { status: 'ok' }
      } catch (e) {
        const status = e?.response?.status
        if (status === 403) return { status: 'unverified', message: formatApiError(e) }
        if (status === 401) return { status: 'failed', message: 'Incorrect email or password.' }
        return { status: 'failed', message: formatApiError(e) }
      }
    },
    [applySession],
  )

  const register = useCallback(async (fields) => {
    try {
      const res = await api.post('/api/auth/register', {
        name: String(fields.name ?? '').trim(),
        email: String(fields.email ?? '').trim().toLowerCase(),
        phone: String(fields.phone ?? '').trim(),
        address: String(fields.address ?? '').trim(),
        password: String(fields.password ?? '').trim(),
        role: ROLES.Customer,
      })
      return { ok: true, email: res.data.email, message: res.data.message }
    } catch (e) {
      return { ok: false, message: formatApiError(e) }
    }
  }, [])

  const resendVerification = useCallback(async (email) => {
    try {
      const res = await api.post('/api/auth/resend-verification', {
        email: String(email ?? '').trim().toLowerCase(),
      })
      return { ok: true, message: res.data?.message }
    } catch (e) {
      return { ok: false, message: formatApiError(e) }
    }
  }, [])

  const value = useMemo(
    () => ({
      ready,
      session,
      user: session,
      role: session?.role ?? null,
      sessionExpired,
      clearSessionExpired: () => setSessionExpired(false),
      login,
      logout,
      register,
      resendVerification,
    }),
    [ready, session, sessionExpired, login, logout, register, resendVerification],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
