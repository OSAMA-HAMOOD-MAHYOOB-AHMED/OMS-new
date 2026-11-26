import { ref } from 'vue'
import { locale } from '../i18n'

// The store sells in Saudi riyals: every amount from the API is already in SAR.
// `currencyCode` and `rate` stay for the pages that pass them along (rate is always 1).
const code = ref('SAR')
const rate = ref(1)

// Whole riyals print without decimals ("172"); anything else keeps two ("17.20").
export function plainAmount(amount) {
  const value = Number(amount) || 0
  const digits = Number.isInteger(Math.round(value * 100) / 100) ? 0 : 2
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function formatSar(amount) {
  // Western digits, like the rest of the Arabic site: "172 ر.س" / "SAR 172".
  return locale.value === 'ar' ? `${plainAmount(amount)} ر.س` : `SAR ${plainAmount(amount)}`
}

export function useCurrency() {
  return { currencyCode: code, rate, format: formatSar }
}
