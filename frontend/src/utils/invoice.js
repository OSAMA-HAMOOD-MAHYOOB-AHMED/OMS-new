export async function downloadInvoicePdf(api, orderID, currencyCode = 'SAR', rate = 1) {
  const res = await api.get(`/api/invoices/${orderID}/pdf`, {
    responseType: 'blob',
    params: { currencyCode, rate },
  })
  const blob = new Blob([res.data], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `invoice-${orderID}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function loadInvoicePdfUrl(api, orderID, currencyCode = 'SAR', rate = 1) {
  const res = await api.get(`/api/invoices/${orderID}/pdf`, {
    responseType: 'blob',
    params: { currencyCode, rate },
  })
  const blob = new Blob([res.data], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}

export function paymentMethodLabel(method) {
  if (method === 'CreditCard') return 'Credit Card'
  if (method === 'OnlineBanking') return 'Online Banking'
  if (method === 'Cash') return 'Cash on Delivery'
  if (method === 'Credit') return 'Credit'
  return method || '—'
}

export { formatSar as formatMoney } from '../composables/useCurrency'

export function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso || '')
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
