import { currentLanguage } from '../i18n'

export function formatDate(iso, withTime = false) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso || '')
  const opts = { year: 'numeric', month: 'short', day: 'numeric' }
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' })
  // Arabic month names with the same Western digits used for prices.
  const locale = currentLanguage() === 'ar' ? 'ar-u-nu-latn' : 'en-GB'
  try {
    return d.toLocaleDateString(locale, opts)
  } catch {
    return d.toLocaleDateString('en-GB', opts)
  }
}

export function paymentMethodLabel(method) {
  if (method === 'CreditCard') return 'Credit Card'
  if (method === 'OnlineBanking') return 'Online Banking'
  if (method === 'Cash') return 'Cash on Delivery'
  if (method === 'Credit') return 'Credit'
  return method || '—'
}

export const ORDER_STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

export const SHIPPING = {
  carrier: 'FedEx',
  service: 'FedEx Express',
  costLabel: 'Free',
  estimatedDelivery: '3–5 business days',
}
