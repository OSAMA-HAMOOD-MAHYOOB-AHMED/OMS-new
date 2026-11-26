import { createContext, useCallback, useContext, useMemo } from 'react'
import { useI18n } from '../i18n'

// The store sells in Saudi riyals: every amount from the API is already in SAR (same as the website).
// `code` and `rate` stay for screens that pass them to the server (rate is always 1).

function plain(amount) {
  return (Number(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** "172.46 ر.س" in Arabic, "SAR 172.46" in English. */
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
