// Ported from frontend/src/utils/validation.js and payment.js so the app
// enforces the same rules as the website.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const EXPIRY_RE = /^(0[1-9]|1[0-2])\/\d{2}$/
const CVV_RE = /^\d{3,4}$/
const CARD_NAME_RE = /^[\p{L}\s'.-]{2,60}$/u

export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

// ---------- Registration / profile ----------

export function validateRegistrationEmail(email) {
  const value = String(email ?? '').trim().toLowerCase()
  if (!value) return 'Email address is required.'
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address (e.g. you@gmail.com).'
  if (value.endsWith('.local')) return 'Use a real email address you can access.'
  if (value.endsWith('@example.com') || value.endsWith('@test.com')) {
    return 'Use a real email address you can access.'
  }
  return null
}

export function validatePassword(password) {
  const value = String(password ?? '')
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Password must include at least one letter and one number.'
  }
  return null
}

export function validatePhone(phone) {
  if (digitsOnly(phone).length < 8) return 'Enter a valid phone number (at least 8 digits).'
  return null
}

export function validateName(name) {
  if (String(name ?? '').trim().length < 2) return 'Full name must be at least 2 characters.'
  return null
}

export function validateAddress(address) {
  if (String(address ?? '').trim().length < 5) return 'Address must be at least 5 characters.'
  return null
}

function clean(errors) {
  const cleaned = Object.fromEntries(Object.entries(errors).filter(([, msg]) => msg))
  return { valid: Object.keys(cleaned).length === 0, errors: cleaned }
}

export function validateRegistrationForm(fields) {
  return clean({
    name: validateName(fields.name),
    email: validateRegistrationEmail(fields.email),
    phone: validatePhone(fields.phone),
    address: validateAddress(fields.address),
    password: validatePassword(fields.password),
  })
}

// ---------- Card payment ----------

export function detectCardBrand(rawNumber) {
  const n = digitsOnly(rawNumber)
  if (!n) return null
  if (/^4/.test(n)) return 'Visa'
  if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  if (/^6(?:011|5)/.test(n)) return 'Discover'
  return 'Card'
}

export function formatCardNumber(rawNumber) {
  const n = digitsOnly(rawNumber).slice(0, 19)
  if (!n) return ''
  if (/^3[47]/.test(n)) {
    return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ')
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

export function validateCardForm(fields) {
  const name = String(fields.cardName ?? '').trim()
  const number = digitsOnly(fields.cardNumber)
  const expiry = String(fields.cardExpiry ?? '').trim()
  const cvv = String(fields.cardCvv ?? '').trim()
  const brand = detectCardBrand(number)

  let cardName = null
  if (!name) cardName = 'Cardholder name is required.'
  else if (!CARD_NAME_RE.test(name)) cardName = 'Enter a valid name (letters only, 2–60 characters).'

  let cardNumber = null
  if (!number) cardNumber = 'Card number is required.'
  else if (number.length < 13 || number.length > 19) cardNumber = 'Card number must be 13–19 digits.'
  else if (!luhnCheck(number)) cardNumber = 'Invalid card number. Check the digits and try again.'

  let cardExpiry = null
  if (!expiry) cardExpiry = 'Expiry date is required.'
  else if (!EXPIRY_RE.test(expiry)) cardExpiry = 'Expiry must be MM/YY (e.g. 12/28).'
  else {
    const [mm, yy] = expiry.split('/').map(Number)
    const expEnd = new Date(2000 + yy, mm, 0, 23, 59, 59, 999)
    if (expEnd < new Date()) cardExpiry = 'This card has expired.'
  }

  let cardCvv = null
  if (!cvv) cardCvv = 'CVV is required.'
  else if (!CVV_RE.test(cvv)) cardCvv = 'CVV must be 3 or 4 digits.'
  else if (brand === 'Amex' && cvv.length !== 4) cardCvv = 'American Express CVV is 4 digits.'
  else if (brand !== 'Amex' && cvv.length !== 3) cardCvv = 'CVV must be 3 digits for this card.'

  return clean({ cardName, cardNumber, cardExpiry, cardCvv })
}
