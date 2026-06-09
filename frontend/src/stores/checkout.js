const PENDING_KEY = 'oms_checkout_pending'
const COMPLETED_KEY = 'oms_checkout_completed'

function readJson(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    sessionStorage.removeItem(key)
    return null
  }
}

function writeJson(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value))
}

export function savePendingCheckout(payload) {
  writeJson(PENDING_KEY, {
    ...payload,
    createdAt: Date.now(),
  })
}

export function loadPendingCheckout() {
  return readJson(PENDING_KEY)
}

export function clearPendingCheckout() {
  sessionStorage.removeItem(PENDING_KEY)
}

export function saveCompletedOrder(order) {
  writeJson(COMPLETED_KEY, {
    ...order,
    completedAt: Date.now(),
  })
}

export function loadCompletedOrder(orderID) {
  const data = readJson(COMPLETED_KEY)
  if (!data || data.orderID !== orderID) return null
  return data
}

export function clearCompletedOrder() {
  sessionStorage.removeItem(COMPLETED_KEY)
}

export function paymentMethodLabel(method) {
  if (method === 'CreditCard') return 'Credit Card'
  if (method === 'Cash') return 'Cash on Delivery'
  return method || '—'
}
