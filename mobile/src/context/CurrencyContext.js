import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Same behavior as the website's useCurrency(): prices are stored in USD and
// shown in the visitor's local currency, detected by IP and cached for 24h.
const CACHE_KEY = 'oms_currency_v1'
const CACHE_TTL = 24 * 60 * 60 * 1000

const CurrencyContext = createContext({ code: 'USD', rate: 1, format: (v) => `$${Number(v || 0).toFixed(2)}` })

async function detectCurrency() {
  const cachedRaw = await AsyncStorage.getItem(CACHE_KEY)
  if (cachedRaw) {
    const cached = JSON.parse(cachedRaw)
    if (Date.now() - cached.ts < CACHE_TTL) return cached
  }
  const geo = await fetch('https://ipapi.co/json/').then((r) => r.json())
  const code = geo.currency || 'USD'
  let rate = 1
  if (code !== 'USD') {
    const rates = await fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json())
    rate = rates.rates?.[code] ?? 1
    if (!rates.rates?.[code]) return { code: 'USD', rate: 1 }
  }
  const value = { code, rate, ts: Date.now() }
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(value))
  return value
}

export function CurrencyProvider({ children }) {
  const [state, setState] = useState({ code: 'USD', rate: 1 })

  useEffect(() => {
    detectCurrency()
      .then((v) => setState({ code: v.code, rate: v.rate }))
      .catch(() => {})
  }, [])

  const format = useCallback(
    (usdAmount) => {
      const converted = Number(usdAmount || 0) * state.rate
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: state.code,
          minimumFractionDigits: 2, // always $4.60, never $4.6
          maximumFractionDigits: 2,
        }).format(converted)
      } catch {
        return `${state.code} ${converted.toFixed(2)}`
      }
    },
    [state],
  )

  const value = useMemo(() => ({ ...state, format }), [state, format])
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
