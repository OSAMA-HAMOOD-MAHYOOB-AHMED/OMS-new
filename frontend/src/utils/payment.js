const EXPIRY_RE = /^(0[1-9]|1[0-2])\/\d{2}$/
const CVV_RE = /^\d{3,4}$/
const CARD_NAME_RE = /^[\p{L}\s'.-]{2,60}$/u

export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function detectCardBrand(rawNumber) {
  const n = digitsOnly(rawNumber)
  if (!n) return null
  if (/^4/.test(n)) return 'Visa'
  if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  if (/^6(?:011|5)/.test(n)) return 'Discover'
  if (/^3(?:0[0-5]|[68])/.test(n)) return 'Diners'
  if (/^35/.test(n)) return 'JCB'
  return 'Card'
}

export function formatCardNumber(rawNumber) {
  const n = digitsOnly(rawNumber).slice(0, 19)
  if (!n) return ''

  if (/^3[47]/.test(n)) {
    const p1 = n.slice(0, 4)
    const p2 = n.slice(4, 10)
    const p3 = n.slice(10, 15)
    return [p1, p2, p3].filter(Boolean).join(' ')
  }

  return n.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export function formatExpiry(raw) {
  const d = digitsOnly(raw).slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

export function luhnCheck(rawNumber) {
  const n = digitsOnly(rawNumber)
  if (n.length < 13 || n.length > 19) return false

  let sum = 0
  let alt = false
  for (let i = n.length - 1; i >= 0; i -= 1) {
    let digit = Number(n[i])
    if (alt) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    alt = !alt
  }
  return sum % 10 === 0
}

export function validateCardName(name) {
  const v = String(name ?? '').trim()
  if (!v) return 'Cardholder name is required.'
  if (!CARD_NAME_RE.test(v)) return 'Enter a valid name (letters only, 2–60 characters).'
  return null
}

export function validateCardNumber(number) {
  const n = digitsOnly(number)
  if (!n) return 'Card number is required.'
  if (n.length < 13 || n.length > 19) return 'Card number must be 13–19 digits.'
  if (!luhnCheck(n)) return 'Invalid card number. Check the digits and try again.'
  if (n === '4000000000000002') return 'This card was declined by the issuer (test decline).'
  return null
}

export function validateExpiry(expiry) {
  const v = String(expiry ?? '').trim()
  if (!v) return 'Expiry date is required.'
  if (!EXPIRY_RE.test(v)) return 'Expiry must be MM/YY (e.g. 12/28).'

  const [mm, yy] = v.split('/').map(Number)
  const now = new Date()
  const expEnd = new Date(2000 + yy, mm, 0, 23, 59, 59, 999)
  if (expEnd < now) return 'This card has expired.'

  return null
}

export function validateCvv(cvv, cardNumber) {
  const v = String(cvv ?? '').trim()
  if (!v) return 'CVV is required.'
  if (!CVV_RE.test(v)) return 'CVV must be 3 or 4 digits.'

  const brand = detectCardBrand(cardNumber)
  if (brand === 'Amex' && v.length !== 4) return 'American Express CVV is 4 digits.'
  if (brand !== 'Amex' && v.length !== 3) return 'CVV must be 3 digits for this card.'

  return null
}

export function validateBankName(bank) {
  const v = String(bank ?? '').trim()
  if (!v) return 'Please select your bank.'
  return null
}

export function validateAccountNumber(account) {
  const n = digitsOnly(account)
  if (!n) return 'Account number is required.'
  if (n.length < 8 || n.length > 20) return 'Account number must be 8–20 digits.'
  if (n === '00000000000000') return 'This account was declined by the bank (test decline).'
  return null
}

export function validatePaymentForm(method, fields) {
  const errors = {}

  if (method === 'CreditCard') {
    errors.cardName = validateCardName(fields.cardName)
    errors.cardNumber = validateCardNumber(fields.cardNumber)
    errors.cardExpiry = validateExpiry(fields.cardExpiry)
    errors.cardCvv = validateCvv(fields.cardCvv, fields.cardNumber)
  } else if (method === 'Cash') {
    // No extra fields required for cash on delivery.
  }

  const cleaned = Object.fromEntries(Object.entries(errors).filter(([, msg]) => msg))
  return { valid: Object.keys(cleaned).length === 0, errors: cleaned }
}

export function isPaymentFormComplete(method, fields) {
  return validatePaymentForm(method, fields).valid
}
