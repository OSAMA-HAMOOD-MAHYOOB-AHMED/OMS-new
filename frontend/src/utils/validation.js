const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

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
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length < 8) return 'Enter a valid phone number (at least 8 digits).'
  return null
}

export function validateName(name) {
  const value = String(name ?? '').trim()
  if (value.length < 2) return 'Full name must be at least 2 characters.'
  return null
}

export function validateAddress(address) {
  const value = String(address ?? '').trim()
  if (value.length < 5) return 'Address must be at least 5 characters.'
  return null
}

export function validateRegistrationForm(fields) {
  const errors = {
    name: validateName(fields.name),
    email: validateRegistrationEmail(fields.email),
    phone: validatePhone(fields.phone),
    address: validateAddress(fields.address),
    password: validatePassword(fields.password),
  }
  const cleaned = Object.fromEntries(Object.entries(errors).filter(([, msg]) => msg))
  return { valid: Object.keys(cleaned).length === 0, errors: cleaned }
}
