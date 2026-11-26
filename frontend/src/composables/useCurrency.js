import { ref } from 'vue'
import { locale } from '../i18n'

// The store sells in Saudi riyals: every amount from the API is already in SAR.
// `currencyCode` and `rate` stay for the pages that pass them along (rate is always 1).
const code = ref('SAR')
const rate = ref(1)

export function formatSar(amount) {
  const value = Number(amount) || 0
  if (locale.value === 'ar') {
    // "172.46 ر.س" with Western digits, like the rest of the Arabic site.
    return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`
  }
  return `SAR ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function useCurrency() {
  return { currencyCode: code, rate, format: formatSar }
}
