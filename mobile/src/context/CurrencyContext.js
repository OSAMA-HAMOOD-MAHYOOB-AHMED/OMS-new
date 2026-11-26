import { createContext, useCallback, useContext, useMemo } from 'react'
import { useI18n } from '../i18n'

// The store sells in Saudi riyals: every amount from the API is already in SAR (same as the website).
// `code` and `rate` stay for screens that pass them to the server (rate is always 1).

// Whole riyals print without decimals ("172"); anything else keeps two ("17.20").
function plain(amount) {
  const value = Number(amount) || 0
  const digits = Number.isInteger(Math.round(value * 100) / 100) ? 0 : 2
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** "172 ر.س" in Arabic, "SAR 172" in English. */
export function formatSar(amount, lang) {
  return lang === 'ar' ? `${plain(amount)} ر.س` : `SAR ${plain(amount)}`
}

const CurrencyContext = createContext({ code: 'SAR', rate: 1, format: (v) => formatSar(v, 'en') })

export function CurrencyProvider({ children }) {
  const { lang } = useI18n()
  const format = useCallback((amount) => formatSar(amount, lang), [lang])
  const value = useMemo(() => ({ code: 'SAR', rate: 1, format }), [format])
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
