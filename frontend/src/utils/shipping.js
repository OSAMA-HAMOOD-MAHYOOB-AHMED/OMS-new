export const SHIPPING = {
  carrier: 'FedEx',
  service: 'FedEx Express',
  cost: 0,
  costLabel: 'Free',
  estimatedDelivery: '3–5 business days',
}

export function trackingNumber(orderId) {
  const compact = String(orderId ?? '')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
  const suffix = compact.slice(-10).padStart(6, '0')
  return `FDX${suffix}`
}

export function shippingSummary() {
  return `${SHIPPING.carrier} ${SHIPPING.service.replace('FedEx ', '')} — ${SHIPPING.costLabel}`
}
