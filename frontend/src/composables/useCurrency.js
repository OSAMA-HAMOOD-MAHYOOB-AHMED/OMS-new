import { ref } from 'vue'

const CACHE_KEY = 'oms_currency_v1'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

const code = ref('USD')
const rate = ref(1)

let promise = null

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (Date.now() - data.ts > CACHE_TTL) return false
    code.value = data.code
    rate.value = data.rate
    return true
  } catch {
    return false
  }
}

async function init() {
  if (loadCache()) return
  try {
    const geo = await fetch('https://ipapi.co/json/').then((r) => r.json())
    const currency = geo.currency || 'USD'
    let exchangeRate = 1
    if (currency !== 'USD') {
      const rates = await fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json())
      exchangeRate = rates.rates?.[currency] ?? 1
    }
    code.value = currency
    rate.value = exchangeRate
    localStorage.setItem(CACHE_KEY, JSON.stringify({ code: currency, rate: exchangeRate, ts: Date.now() }))
  } catch {
    // fallback: keep USD
  }
}

export function useCurrency() {
  if (!promise) promise = init()

  function format(usdAmount) {
    const converted = Number(usdAmount) * rate.value
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code.value,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted)
  }

  return { currencyCode: code, rate, format }
}
